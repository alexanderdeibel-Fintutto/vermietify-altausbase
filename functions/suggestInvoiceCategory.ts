import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const CATEGORY_KEYWORDS = {
  'Nebenkosten': ['wasser', 'gas', 'strom', 'heizung', 'wärmepumpe'],
  'Gebäudeunterhalt': ['reparatur', 'wartung', 'inspektion', 'prüfung', 'reinigung'],
  'Garten': ['gärtner', 'garten', 'grünflächenpflege', 'schnee', 'laub'],
  'Versicherung': ['versicherung', 'allianz', 'axa', 'huk'],
  'Verwaltung': ['hausverwaltung', 'makler', 'steuerberater', 'rechtsanwalt'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { description, limit = 3 } = await req.json();
    const descLower = description?.toLowerCase() || '';

    // Get all cost types
    const costTypes = await base44.entities.CostType.list();

    // Score by keyword matching
    const scored = costTypes
      .map(ct => {
        let confidence = 0;
        
        // Direct category match
        if (descLower.includes(ct.main_category?.toLowerCase())) confidence += 50;
        if (descLower.includes(ct.sub_category?.toLowerCase())) confidence += 40;
        
        // Keyword matching
        Object.entries(CATEGORY_KEYWORDS).forEach(([cat, keywords]) => {
          if (ct.main_category === cat && keywords.some(kw => descLower.includes(kw))) {
            confidence += 30;
          }
        });

        return { ...ct, confidence };
      })
      .filter(ct => ct.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    return Response.json({ suggestions: scored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});