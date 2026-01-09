import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const { from_date, to_date, keywords } = await req.json();
    
    const taxKeywords = keywords || [
      'Einkommensteuer', 'EStG', 'Abschreibung', 'AfA',
      'Umsatzsteuer', 'UStG', 'Gewerbesteuer', 'GewStG',
      'Vermietung', 'Verpachtung', 'Grunderwerbsteuer',
      'Werbungskosten', 'Betriebsausgaben', 'Freibetrag',
      'Steuersatz', 'Steueränderung'
    ];
    
    // Use AI to search for tax law changes
    const webSearchResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Suche nach aktuellen Steuergesetzänderungen in Deutschland der letzten 30 Tage.
               Fokus auf: ${taxKeywords.slice(0, 8).join(', ')}.
               
               Für jede gefundene Änderung liefere:
               - Titel der Änderung
               - BGBl-Referenz (falls vorhanden)
               - Betroffene Gesetze/Paragraphen
               - Inkrafttreten-Datum
               - Kurze Zusammenfassung (max 200 Zeichen)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                bgbl_reference: { type: 'string' },
                affected_laws: { type: 'array', items: { type: 'string' } },
                effective_date: { type: 'string' },
                summary: { type: 'string' },
                source_url: { type: 'string' }
              }
            }
          }
        }
      }
    });
    
    const bgblResults = webSearchResult?.changes || [];
    const newUpdates = [];
    
    for (const result of bgblResults) {
      const existingUpdates = await base44.entities.TaxLawUpdate.filter({
        source_reference: result.bgbl_reference || result.title
      });
      
      if (existingUpdates.length === 0) {
        const relevanceScore = calculateRelevanceScore(result, taxKeywords);
        const affectedTaxTypes = detectAffectedTaxTypes(result);
        
        const newUpdate = await base44.entities.TaxLawUpdate.create({
          source_type: result.bgbl_reference ? 'BGBL' : 'AI_DETECTION',
          source_reference: result.bgbl_reference || `AI_${Date.now()}`,
          source_url: result.source_url || null,
          title: result.title,
          summary: result.summary,
          affected_tax_types: affectedTaxTypes,
          affected_paragraphs: result.affected_laws || [],
          effective_date: result.effective_date ? new Date(result.effective_date).toISOString() : null,
          effective_tax_year: result.effective_date ? 
            new Date(result.effective_date).getFullYear() : new Date().getFullYear(),
          raw_content: JSON.stringify(result),
          status: 'DETECTED',
          relevance_score: relevanceScore
        });
        
        newUpdates.push(newUpdate);
      }
    }
    
    return Response.json({
      success: true,
      total_found: bgblResults.length,
      new_updates: newUpdates.length,
      updates: newUpdates
    });
    
  } catch (error) {
    console.error('Error fetching BGBl updates:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});

function calculateRelevanceScore(result, keywords) {
  let score = 0;
  const text = `${result.title} ${result.summary || ''} ${(result.affected_laws || []).join(' ')}`.toLowerCase();
  
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }
  
  if (text.includes('estg') || text.includes('einkommensteuergesetz')) score += 20;
  if (text.includes('ustg') || text.includes('umsatzsteuergesetz')) score += 15;
  if (text.includes('gewstg')) score += 15;
  if (text.includes('afa') || text.includes('abschreibung')) score += 25;
  
  return Math.min(100, score);
}

function detectAffectedTaxTypes(result) {
  const types = [];
  const text = `${result.title} ${result.summary || ''} ${(result.affected_laws || []).join(' ')}`.toLowerCase();
  
  if (text.includes('vermiet') || text.includes('verpacht') || text.includes('anlage v')) types.push('ANLAGE_V');
  if (text.includes('kapital') || text.includes('anlage kap') || text.includes('dividende')) types.push('ANLAGE_KAP');
  if (text.includes('einkommensteuer') || text.includes('estg') || text.includes('§ 7') || text.includes('afa')) types.push('EST');
  if (text.includes('gewerbesteuer') || text.includes('gewstg')) types.push('GEWST');
  if (text.includes('umsatzsteuer') || text.includes('ustg') || text.includes('mehrwertsteuer')) types.push('UST');
  if (text.includes('grunderwerbsteuer') || text.includes('grest')) types.push('GREST');
  if (text.includes('überschuss') || text.includes('eür') || text.includes('betriebsausgabe')) types.push('EUER');
  
  return types.length > 0 ? types : ['ALLGEMEIN'];
}