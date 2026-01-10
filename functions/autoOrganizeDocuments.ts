import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { analyze_all = false } = await req.json();

  const documents = await base44.entities.Document.filter(
    { ai_processed: false },
    '-created_date',
    50
  );

  const buildings = await base44.entities.Building.list(null, 100);
  let organized = 0;

  for (const doc of documents) {
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere dieses Dokument: "${doc.name}". Bestimme: 1) Kategorie (Mietrecht/Verwaltung/Finanzen/Sonstiges), 2) Passende Tags, 3) Ob es einem Gebäude zugeordnet werden kann`,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          building_suggestion: { type: 'string' }
        }
      }
    });

    const updates = {
      ai_category: analysis.category,
      ai_tags: analysis.tags,
      ai_processed: true
    };

    if (analysis.building_suggestion) {
      const matchedBuilding = buildings.find(b => 
        b.name?.toLowerCase().includes(analysis.building_suggestion.toLowerCase())
      );
      if (matchedBuilding) {
        updates.building_id = matchedBuilding.id;
      }
    }

    await base44.entities.Document.update(doc.id, updates);
    organized++;
  }

  return Response.json({
    success: true,
    organized,
    total: documents.length
  });
});