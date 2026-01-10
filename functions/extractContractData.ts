import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url } = await req.json();

  const extractedData = await base44.integrations.Core.InvokeLLM({
    prompt: `Analysiere diesen Mietvertrag und extrahiere folgende Informationen:
    - Name des Mieters (vollständiger Name)
    - Kaltmiete (nur Zahl in Euro)
    - Nebenkosten (nur Zahl in Euro)
    - Kaution (nur Zahl in Euro)
    - Mietbeginn (Datum im Format YYYY-MM-DD)
    - Mietende (Datum im Format YYYY-MM-DD, oder "unbefristet")
    - Kündigungsfrist in Monaten
    
    Gib auch eine Konfidenz-Bewertung (0-100) an, wie sicher die Extraktion ist.`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        tenant_name: { type: 'string' },
        base_rent: { type: 'number' },
        utilities: { type: 'number' },
        deposit: { type: 'number' },
        start_date: { type: 'string' },
        end_date: { type: 'string' },
        notice_period_months: { type: 'number' },
        confidence: { type: 'number' }
      }
    }
  });

  return Response.json(extractedData);
});