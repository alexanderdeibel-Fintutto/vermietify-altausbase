import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant, unit, building, contract_data } = await req.json();

    // Generate contract content using AI
    const contractContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle einen vollständigen Mietvertrag für eine Wohnung in Deutschland.

Mieter: ${tenant.first_name} ${tenant.last_name}
Adresse Mieter: ${tenant.address || 'Noch nicht bekannt'}
Email: ${tenant.email}
Telefon: ${tenant.phone || ''}

Wohnung: ${unit.unit_number}
Gebäude: ${building.name}
Adresse: ${building.street} ${building.house_number}, ${building.postal_code} ${building.city}
Größe: ${unit.size_sqm || 'N/A'} m²
Zimmer: ${unit.rooms || 'N/A'}

Mietbeginn: ${contract_data?.start_date || 'Zu bestimmen'}
${contract_data?.is_unlimited ? 'Unbefristet' : `Mietende: ${contract_data?.end_date}`}
Kaltmiete: ${contract_data?.base_rent || 0}€
Nebenkosten: ${contract_data?.utilities || 0}€
Heizkosten: ${contract_data?.heating || 0}€
Warmmiete: ${(contract_data?.base_rent || 0) + (contract_data?.utilities || 0) + (contract_data?.heating || 0)}€
Kaution: ${contract_data?.deposit || 0}€
Fälligkeit: ${contract_data?.rent_due_day || 3}. des Monats

Erstelle einen rechtsgültigen Mietvertrag mit allen erforderlichen Klauseln gemäß deutschem Mietrecht. Verwende professionelle Sprache und strukturiere den Vertrag in Paragraphen.`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Create document entity
    const document = await base44.asServiceRole.entities.Document.create({
      name: `Mietvertrag - ${tenant.first_name} ${tenant.last_name} - ${building.name}`,
      category: 'Mietrecht',
      status: 'erstellt',
      content: contractContent.content,
      building_id: building.id,
      unit_id: unit.id,
      tenant_id: tenant.id,
      data_snapshot: {
        tenant,
        unit,
        building,
        contract_data,
        generated_at: new Date().toISOString()
      }
    });

    return Response.json(document);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});