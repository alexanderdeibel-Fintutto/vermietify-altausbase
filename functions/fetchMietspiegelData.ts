import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { city, postal_code, year = 2024 } = await req.json();

    console.log(`[Mietspiegel] Fetching data for ${city}, PLZ ${postal_code}`);

    // Use LLM with internet context to fetch current rental market data
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Ermittle aktuelle Mietpreisdaten für ${city}, PLZ ${postal_code} in Deutschland für das Jahr ${year}.
      
Analysiere folgende Quellen:
- Offizieller Mietspiegel der Stadt
- Statistisches Landesamt
- Immobilienmarkt-Datenbanken

Gib für verschiedene Wohnlagen (Einfach, Mittel, Gut, Sehr gut) und Wohnungsgrößen die durchschnittlichen Mietpreise pro m² an.

Wichtig:
- Nettokaltmiete pro m² (ohne Nebenkosten)
- Unterscheide nach Baujahr (Altbau/Neubau)
- Gib an, ob Mietpreisbremse aktiv ist
- Gib die Kappungsgrenze an (15% oder 20%)`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          city: { type: "string" },
          postal_code: { type: "string" },
          mietpreisbremse_aktiv: { type: "boolean" },
          kappungsgrenze: { type: "number" },
          data_source: { type: "string" },
          last_updated: { type: "string" },
          rent_ranges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                wohnlage: { type: "string" },
                baujahr_von: { type: "number" },
                baujahr_bis: { type: "number" },
                qm_von: { type: "number" },
                qm_bis: { type: "number" },
                miete_min: { type: "number" },
                miete_mittel: { type: "number" },
                miete_max: { type: "number" }
              }
            }
          }
        }
      }
    });

    // Store in database
    const today = new Date().toISOString().split('T')[0];
    const gueltig_bis = new Date();
    gueltig_bis.setFullYear(gueltig_bis.getFullYear() + 2);

    for (const range of result.rent_ranges || []) {
      await base44.entities.RentIndex.create({
        city: result.city,
        postal_code: result.postal_code,
        district: '',
        wohnlage: range.wohnlage,
        baujahr_von: range.baujahr_von || 0,
        baujahr_bis: range.baujahr_bis || 9999,
        qm_von: range.qm_von || 0,
        qm_bis: range.qm_bis || 9999,
        miete_min: range.miete_min,
        miete_mittel: range.miete_mittel,
        miete_max: range.miete_max,
        mietpreisbremse_aktiv: result.mietpreisbremse_aktiv || false,
        kappungsgrenze: result.kappungsgrenze || 15,
        vergleichsmiete_quelle: result.data_source || 'AI-gestützte Marktanalyse',
        gueltig_ab: today,
        gueltig_bis: gueltig_bis.toISOString().split('T')[0]
      });
    }

    console.log(`[Mietspiegel] Imported ${result.rent_ranges?.length || 0} rent ranges`);

    return Response.json({ 
      success: true,
      imported_ranges: result.rent_ranges?.length || 0,
      data: result
    });
  } catch (error) {
    console.error('Mietspiegel fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});