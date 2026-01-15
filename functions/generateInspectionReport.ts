import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, unitId, findings } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Erstelle einen professionellen Inspektionsbericht basierend auf den Befunden:

Gebäude: ${buildingId}
Einheit: ${unitId}
Befunde: ${JSON.stringify(findings)}

Generiere einen strukturierten Bericht mit:
{
  "title": "Inspektionsbericht",
  "date": "YYYY-MM-DD",
  "summary": "Zusammenfassung",
  "findings": [
    {
      "category": "Kategorie (Elektrik, Sanitär, Struktur, etc.)",
      "severity": "KRITISCH|SCHWERWIEGEND|MODERAT|GERING",
      "description": "Beschreibung",
      "recommendation": "Empfohlene Aktion",
      "estimated_cost": "Geschätzte Kosten EUR"
    }
  ],
  "overall_condition": "GUT|BEFRIEDIGEND|MANGELHAFT",
  "next_inspection": "YYYY-MM-DD",
  "notes": "Zusätzliche Notizen"
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    date: { type: 'string' },
                    summary: { type: 'string' },
                    findings: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                category: { type: 'string' },
                                severity: { type: 'string' },
                                description: { type: 'string' },
                                recommendation: { type: 'string' },
                                estimated_cost: { type: 'string' }
                            }
                        }
                    },
                    overall_condition: { type: 'string' },
                    next_inspection: { type: 'string' },
                    notes: { type: 'string' }
                }
            }
        });

        // Speichere Report
        const report = await base44.entities.BuildingInspection.create({
            building_id: buildingId,
            unit_id: unitId,
            inspection_date: new Date().toISOString().split('T')[0],
            overall_condition: response.overall_condition,
            report_content: JSON.stringify(response),
            status: 'completed',
            inspector_email: user.email
        });

        return new Response(JSON.stringify({
            success: true,
            report_id: report.id,
            report: response
        }), { status: 200 });

    } catch (error) {
        console.error('Inspection report error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});