import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { file_url } = await req.json();

  const categorization = await base44.integrations.Core.InvokeLLM({
    prompt: `Analysiere dieses Dokument und kategorisiere es. Mögliche Kategorien:
    - Rechnung (Invoices, Bills)
    - Mietvertrag (Lease Agreements)
    - Korrespondenz (Letters, Emails, Communication)
    - Behördlich (Official Documents, Tax Forms)
    - Sonstiges (Other)
    
    Extrahiere auch:
    - 3-5 relevante Schlagwörter
    - Eine kurze Zusammenfassung (max 100 Zeichen)
    - Empfohlene Zuordnung zu: Building, Tenant, oder None
    - Konfidenz-Bewertung (0-100)`,
    file_urls: [file_url],
    response_json_schema: {
      type: 'object',
      properties: {
        category: { 
          type: 'string',
          enum: ['Rechnung', 'Mietvertrag', 'Korrespondenz', 'Behördlich', 'Sonstiges']
        },
        tags: { 
          type: 'array',
          items: { type: 'string' }
        },
        summary: { type: 'string' },
        suggested_entity: { type: 'string' },
        confidence: { type: 'number' }
      }
    }
  });

  // Auto-create document record
  await base44.entities.Document.create({
    name: `Dokument ${new Date().toISOString().split('T')[0]}`,
    category: categorization.category === 'Mietvertrag' ? 'Mietrecht' : 
              categorization.category === 'Rechnung' ? 'Finanzen' : 'Sonstiges',
    status: 'erstellt',
    file_url,
    ai_category: categorization.category,
    ai_tags: categorization.tags,
    ai_summary: categorization.summary,
    ai_processed: true
  });

  return Response.json(categorization);
});