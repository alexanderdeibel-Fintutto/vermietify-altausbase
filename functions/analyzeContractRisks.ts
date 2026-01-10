import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url } = await req.json();

  const riskAnalysis = await base44.integrations.Core.InvokeLLM({
    prompt: `Analysiere diesen Mietvertrag auf Risiken und unübliche Klauseln. Prüfe:
    
    1. RISIKEN - Identifiziere potenzielle rechtliche oder finanzielle Risiken:
       - Unwirksame Klauseln nach BGB
       - Unüblich hohe Nebenkostenpauschalen
       - Fehlende Kündigungsfristen
       - Problematische Schönheitsreparatur-Klauseln
       - Indexmieten ohne gesetzliche Grundlage
       
    2. ABWEICHUNGEN - Erkenne Abweichungen von Standard-Mietverträgen:
       - Unübliche Vertragslaufzeiten
       - Abweichende Kündigungsfristen
       - Besondere Vereinbarungen
       
    3. EMPFEHLUNGEN - Gib konkrete Handlungsempfehlungen
    
    Bewerte das Gesamt-Risiko von 0 (kein Risiko) bis 100 (sehr hohes Risiko).
    Kategorisiere jedes Risiko als: high, medium, low`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        risk_score: { type: 'number' },
        risk_level: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              clause_reference: { type: 'string' }
            }
          }
        },
        deviations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  });

  return Response.json(riskAnalysis);
});