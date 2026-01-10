import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant, unit, building, type } = await req.json();

    const protocolContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle ein vollständiges ${type === 'move_in' ? 'Einzugs' : 'Auszugs'}protokoll für eine Wohnungsübergabe.

Mieter: ${tenant.first_name} ${tenant.last_name}
Wohnung: ${unit.unit_number}
Gebäude: ${building.name}
Adresse: ${building.street} ${building.house_number}, ${building.postal_code} ${building.city}
Größe: ${unit.size_sqm || 'N/A'} m²
Zimmer: ${unit.rooms || 'N/A'}

Erstelle ein detailliertes Übergabeprotokoll mit:
- Allgemeine Angaben
- Zählerstände (Strom, Wasser, Gas, Heizung)
- Zustand der Räume (Wohnzimmer, Schlafzimmer, Küche, Bad, etc.)
- Zustand von Böden, Wänden, Decken
- Zustand von Fenstern und Türen
- Sanitäranlagen
- Elektroinstallationen
- Schlüsselübergabe
- Unterschriftenfeld

Verwende eine Tabelle für jeden Raum mit Spalten für: Raum, Zustand, Mängel, Bemerkungen`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          meter_readings: {
            type: "object",
            properties: {
              electricity: { type: "string" },
              water: { type: "string" },
              gas: { type: "string" },
              heating: { type: "string" }
            }
          },
          rooms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                condition: { type: "string" },
                defects: { type: "string" }
              }
            }
          }
        }
      }
    });

    const document = await base44.asServiceRole.entities.Document.create({
      name: `${type === 'move_in' ? 'Einzugs' : 'Auszugs'}protokoll - ${tenant.first_name} ${tenant.last_name}`,
      category: 'Verwaltung',
      status: 'erstellt',
      content: protocolContent.content,
      building_id: building.id,
      unit_id: unit.id,
      tenant_id: tenant.id,
      data_snapshot: {
        tenant,
        unit,
        building,
        type,
        meter_readings: protocolContent.meter_readings,
        rooms: protocolContent.rooms,
        generated_at: new Date().toISOString()
      }
    });

    return Response.json(document);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});