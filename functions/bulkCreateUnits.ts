import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { 
      building_id, 
      count, 
      start_number, 
      template 
    } = payload;

    const units = [];
    
    for (let i = 0; i < count; i++) {
      const unitNumber = start_number + i;
      
      units.push({
        building_id,
        einheit_nummer: `${unitNumber}`,
        bezeichnung: template.bezeichnung ? `${template.bezeichnung} ${unitNumber}` : null,
        typ: template.typ || 'Wohnung',
        stockwerk: template.stockwerk || Math.floor(i / 4) + 1,
        flaeche_qm: template.flaeche_qm || 0,
        zimmer: template.zimmer || 0,
        anzahl_badezimmer: template.anzahl_badezimmer || 1,
        hat_balkon: template.hat_balkon || false,
        hat_keller: template.hat_keller || false,
        status: 'Verfügbar'
      });
    }

    const created = await base44.entities.Unit.bulkCreate(units);

    return Response.json({
      success: true,
      created_count: created.length,
      units: created
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});