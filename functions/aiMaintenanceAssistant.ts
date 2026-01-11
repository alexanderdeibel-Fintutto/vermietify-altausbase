import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, maintenance_task_id, building_id, company_id } = await req.json();
    
    if (action === 'categorize_and_prioritize') {
      const task = await base44.asServiceRole.entities.MaintenanceTask.read(maintenance_task_id);
      
      const prompt = `Analysiere diese Wartungsanfrage und kategorisiere sie:

Titel: ${task.title}
Beschreibung: ${task.description || 'Keine Details'}

Bewerte:
1. Kategorie (plumbing, electrical, hvac, appliance, structural, other)
2. Priorität (low, medium, high, urgent)
3. Geschätzte Kosten (niedrig <500€, mittel 500-2000€, hoch >2000€)
4. Empfohlene Reaktionszeit in Stunden

Antworte nur mit JSON im Format:
{
  "category": "...",
  "priority": "...",
  "estimated_cost_range": "...",
  "recommended_response_time_hours": ...,
  "reasoning": "..."
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            priority: { type: "string" },
            estimated_cost_range: { type: "string" },
            recommended_response_time_hours: { type: "number" },
            reasoning: { type: "string" }
          }
        }
      });
      
      return Response.json({ analysis });
    }
    
    if (action === 'suggest_vendors') {
      const task = await base44.asServiceRole.entities.MaintenanceTask.read(maintenance_task_id);
      const vendors = await base44.asServiceRole.entities.Vendor.filter({ company_id });
      
      const vendorList = vendors.map(v => 
        `${v.name} - Typ: ${v.vendor_type}, Bewertung: ${v.average_rating || 'N/A'}, Verfügbar: ${v.available ? 'Ja' : 'Nein'}`
      ).join('\n');
      
      const prompt = `Empfehle die besten 3 Dienstleister für folgende Anfrage:

Wartung: ${task.title}
Beschreibung: ${task.description}
Kategorie: ${task.category}

Verfügbare Dienstleister:
${vendorList}

Berücksichtige: Verfügbarkeit, Bewertung, Spezialisierung.
Antworte nur mit JSON:
{
  "recommended_vendors": [
    {"vendor_name": "...", "reasoning": "..."}
  ]
}`;

      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_vendors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vendor_name: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      return Response.json({ suggestions });
    }
    
    if (action === 'draft_response') {
      const task = await base44.asServiceRole.entities.MaintenanceTask.read(maintenance_task_id);
      const tenant = await base44.asServiceRole.entities.Tenant.read(task.tenant_id);
      
      const prompt = `Verfasse eine professionelle Antwort an den Mieter:

Mieter: ${tenant.first_name} ${tenant.last_name}
Anfrage: ${task.title}
Status: ${task.status}
Priorität: ${task.priority}

Die Nachricht soll:
- Freundlich und professionell sein
- Den aktuellen Status erklären
- Nächste Schritte beschreiben
- Bei hoher Priorität Dringlichkeit kommunizieren

Verfasse die Nachricht auf Deutsch, max. 150 Wörter.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      
      return Response.json({ draft_message: response });
    }
    
    if (action === 'predict_issues') {
      const allTasks = await base44.asServiceRole.entities.MaintenanceTask.filter({ 
        building_id 
      });
      
      const taskSummary = {};
      allTasks.forEach(task => {
        const key = `${task.category}-${task.unit_id}`;
        taskSummary[key] = (taskSummary[key] || 0) + 1;
      });
      
      const historicalData = Object.entries(taskSummary)
        .map(([key, count]) => `${key}: ${count} Anfragen`)
        .join('\n');
      
      const prompt = `Analysiere diese Wartungsdaten und erkenne Muster:

Historische Anfragen nach Kategorie und Einheit:
${historicalData}

Identifiziere:
1. Einheiten/Bereiche mit wiederkehrenden Problemen
2. Wahrscheinliche zukünftige Wartungsbedarfe
3. Empfehlungen für präventive Maßnahmen

Antworte mit JSON:
{
  "high_risk_units": [{"unit_id": "...", "predicted_issue": "...", "confidence": "..."}],
  "recommended_preventive_actions": ["..."],
  "general_insights": "..."
}`;

      const predictions = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            high_risk_units: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  unit_id: { type: "string" },
                  predicted_issue: { type: "string" },
                  confidence: { type: "string" }
                }
              }
            },
            recommended_preventive_actions: {
              type: "array",
              items: { type: "string" }
            },
            general_insights: { type: "string" }
          }
        }
      });
      
      return Response.json({ predictions });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});