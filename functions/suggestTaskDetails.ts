import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Intelligente Task-Detail-Vorschläge
 * Analysiert Titel und Beschreibung und schlägt vor:
 * - Zugeordnetes Objekt (Building)
 * - Priorität
 * - Workflow
 * - Fälligkeitsdatum
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { task_title, task_description = '' } = await req.json();

        if (!task_title || task_title.length < 3) {
            return Response.json({
                success: true,
                suggestions: null
            });
        }

        const text = `${task_title} ${task_description}`.toLowerCase();

        // Daten abrufen
        const [buildings, priorities, workflows] = await Promise.all([
            base44.entities.Building.list(),
            base44.entities.TaskPriority.list('sort_order'),
            base44.entities.Workflow.list()
        ]);

        const suggestions = {
            building_id: null,
            building_name: null,
            priority_id: null,
            priority_name: null,
            workflow_id: null,
            workflow_name: null,
            due_date: null,
            confidence: 0,
            reasoning: []
        };

        // 1. Objektzuordnung - Suche nach Gebäudenamen, Adressen oder Einheitennummern
        for (const building of buildings) {
            const buildingMatches = [
                building.name?.toLowerCase(),
                building.address?.toLowerCase(),
                `${building.address} ${building.house_number}`.toLowerCase(),
                building.city?.toLowerCase()
            ].filter(Boolean);

            for (const match of buildingMatches) {
                if (text.includes(match)) {
                    suggestions.building_id = building.id;
                    suggestions.building_name = building.name;
                    suggestions.confidence += 25;
                    suggestions.reasoning.push(`Objekt "${building.name}" im Text gefunden`);
                    break;
                }
            }
            if (suggestions.building_id) break;
        }

        // Einheitennummern erkennen (z.B. "Wohnung 3.2", "WE 12", "Einheit 5")
        const unitPatterns = [
            /wohnung\s*(\d+\.?\d*)/i,
            /we\s*(\d+)/i,
            /einheit\s*(\d+)/i,
            /apartment\s*(\d+)/i
        ];

        for (const pattern of unitPatterns) {
            const match = text.match(pattern);
            if (match) {
                suggestions.reasoning.push(`Einheit "${match[1]}" erkannt`);
                suggestions.confidence += 10;
                break;
            }
        }

        // 2. Prioritätssetzung basierend auf Keywords
        const urgentKeywords = ['dringend', 'sofort', 'notfall', 'asap', 'eilig', 'defekt', 'kaputt', 'wasserschaden', 'feuer', 'brand'];
        const highKeywords = ['wichtig', 'schnell', 'bald', 'reparatur', 'mängel', 'beschwerde'];
        const lowKeywords = ['gelegentlich', 'irgendwann', 'später', 'information', 'anfrage'];

        const hasUrgent = urgentKeywords.some(kw => text.includes(kw));
        const hasHigh = highKeywords.some(kw => text.includes(kw));
        const hasLow = lowKeywords.some(kw => text.includes(kw));

        if (hasUrgent && priorities.length > 0) {
            const urgentPriority = priorities.find(p => p.name.toLowerCase().includes('dringend')) || priorities[priorities.length - 1];
            suggestions.priority_id = urgentPriority.id;
            suggestions.priority_name = urgentPriority.name;
            suggestions.confidence += 30;
            suggestions.reasoning.push(`Dringlichkeits-Keywords gefunden → ${urgentPriority.name}`);
        } else if (hasHigh && priorities.length > 0) {
            const highPriority = priorities.find(p => p.name.toLowerCase().includes('hoch')) || priorities[Math.max(priorities.length - 2, 0)];
            suggestions.priority_id = highPriority.id;
            suggestions.priority_name = highPriority.name;
            suggestions.confidence += 20;
            suggestions.reasoning.push(`Wichtigkeits-Keywords gefunden → ${highPriority.name}`);
        } else if (hasLow && priorities.length > 0) {
            const lowPriority = priorities.find(p => p.name.toLowerCase().includes('niedrig')) || priorities[0];
            suggestions.priority_id = lowPriority.id;
            suggestions.priority_name = lowPriority.name;
            suggestions.confidence += 15;
            suggestions.reasoning.push(`Niedrige Priorität erkannt → ${lowPriority.name}`);
        } else if (priorities.length > 0) {
            // Standard: Normal-Priorität
            const normalPriority = priorities.find(p => p.name.toLowerCase().includes('normal')) || priorities[Math.floor(priorities.length / 2)];
            suggestions.priority_id = normalPriority.id;
            suggestions.priority_name = normalPriority.name;
            suggestions.confidence += 10;
        }

        // 3. Workflow-Zuordnung
        for (const workflow of workflows) {
            const workflowKeywords = workflow.name.toLowerCase().split(/\s+/);
            const matchCount = workflowKeywords.filter(kw => text.includes(kw)).length;
            
            if (matchCount > 0) {
                suggestions.workflow_id = workflow.id;
                suggestions.workflow_name = workflow.name;
                suggestions.confidence += matchCount * 10;
                suggestions.reasoning.push(`Workflow "${workflow.name}" passt zum Inhalt`);
                break;
            }
        }

        // 4. Fälligkeitsdatum-Berechnung
        const now = new Date();
        let dueDays = 7; // Standard: 7 Tage

        // Basierend auf Priorität
        if (suggestions.priority_id) {
            const priority = priorities.find(p => p.id === suggestions.priority_id);
            if (priority?.default_due_days) {
                dueDays = priority.default_due_days;
                suggestions.reasoning.push(`Fälligkeit: ${dueDays} Tage (basierend auf Priorität)`);
            }
        }

        // Explizite Zeitangaben im Text erkennen
        const timePatterns = [
            { pattern: /heute|sofort/i, days: 0 },
            { pattern: /morgen/i, days: 1 },
            { pattern: /diese\s+woche/i, days: 3 },
            { pattern: /nächste\s+woche/i, days: 7 },
            { pattern: /in\s+(\d+)\s+tag/i, extract: true }
        ];

        for (const { pattern, days, extract } of timePatterns) {
            const match = text.match(pattern);
            if (match) {
                if (extract && match[1]) {
                    dueDays = parseInt(match[1]);
                    suggestions.reasoning.push(`Explizite Zeitangabe: ${dueDays} Tage`);
                } else {
                    dueDays = days;
                    suggestions.reasoning.push(`Zeitangabe erkannt: ${days} Tage`);
                }
                suggestions.confidence += 15;
                break;
            }
        }

        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + dueDays);
        suggestions.due_date = dueDate.toISOString();

        // Confidence Score normalisieren (0-100)
        suggestions.confidence = Math.min(100, suggestions.confidence);

        return Response.json({
            success: true,
            suggestions: suggestions.confidence > 20 ? suggestions : null
        });

    } catch (error) {
        console.error('Task details suggestion error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});