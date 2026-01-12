import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, building_id } = await req.json();

    console.log(`[Energy Passport] Extracting data from PDF`);

    const extractedData = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere diesen Energieausweis und extrahiere alle relevanten Daten.

Achte besonders auf:
- Typ (Verbrauchsausweis oder Bedarfsausweis)
- Energieeffizienzklasse (A+ bis H)
- Endenergiebedarf in kWh/(m²·a)
- Primärenergiebedarf in kWh/(m²·a)
- Wesentlicher Energieträger (Gas, Öl, Fernwärme, etc.)
- CO₂-Emissionen in kg/(m²·a)
- Ausstellungsdatum
- Gültigkeitsdatum (normalerweise 10 Jahre ab Ausstellung)
- Name und Registriernummer des Ausstellers
- Modernisierungsempfehlungen

Extrahiere alle verfügbaren Informationen.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          ausweis_typ: { type: "string" },
          energieeffizienzklasse: { type: "string" },
          endenergiebedarf: { type: "number" },
          primaerenergiebedarf: { type: "number" },
          energietraeger: { type: "string" },
          co2_emissionen: { type: "number" },
          ausstellungsdatum: { type: "string" },
          gueltig_bis: { type: "string" },
          warmwasserbereitung_enthalten: { type: "boolean" },
          aussteller_name: { type: "string" },
          aussteller_registriernummer: { type: "string" },
          modernisierungsempfehlungen: { type: "string" }
        }
      }
    });

    // Generate mandatory information for listings (GEG requirement)
    const pflichtangaben = generateMandatoryInfo(extractedData);

    // Determine status based on validity
    const status = determineStatus(extractedData.gueltig_bis);

    const passportData = {
      building_id,
      ...extractedData,
      datei_url: file_url,
      pflichtangaben_generiert: pflichtangaben,
      status
    };

    const created = await base44.entities.EnergyPassport.create(passportData);

    console.log(`[Energy Passport] Created passport ${created.id} for building ${building_id}`);

    return Response.json({ 
      success: true,
      passport_id: created.id,
      data: extractedData
    });
  } catch (error) {
    console.error('Energy passport extraction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateMandatoryInfo(data) {
  return `Energieausweis: ${data.ausweis_typ || 'k.A.'}, Energieeffizienzklasse: ${data.energieeffizienzklasse || 'k.A.'}, Endenergiebedarf: ${data.endenergiebedarf || 'k.A.'} kWh/(m²·a), wesentlicher Energieträger: ${data.energietraeger || 'k.A.'}, Baujahr Heizung: siehe Gebäudedaten`;
}

function determineStatus(gueltigBis) {
  if (!gueltigBis) return 'Gültig';
  
  const validUntil = new Date(gueltigBis);
  const today = new Date();
  const monthsUntilExpiry = (validUntil - today) / (1000 * 60 * 60 * 24 * 30);

  if (monthsUntilExpiry < 0) return 'Abgelaufen';
  if (monthsUntilExpiry < 6) return 'Läuft bald ab';
  return 'Gültig';
}