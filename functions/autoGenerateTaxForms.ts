import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();
    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];
    const calculation = (await base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year }, '-updated_date', 1))[0];

    // Auto Tax Form Generation
    const forms = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere notwendige Tax Forms für ${user.email} in ${country} (${tax_year}):

PROFIL:
- Einkommenstypen: ${profile.income_sources?.map(s => s.type).join(', ')}
- Assets: ${profile.asset_categories?.join(', ')}
- Geschäfte: ${profile.business_entities?.length || 0} entities

TAX DATA:
${JSON.stringify(calculation?.calculation_data || {}, null, 2)}

LÄNDER-SPEZIFISCHE FORMS:
${country === 'DE' ? 'Anlage N/S/SO/KAP/VG, ESt 1A, Umsatzsteuer' :
country === 'CH' ? 'Ordentliche Steuererklärung, Vermögensaufstellung, Gewinneinkünfte' :
'Relevant tax forms per Austrian law'}

GEBE LISTE VON:
- Form Namen
- Required Fields
- Data Mapping (welche Daten wohin)
- Validation Rules
- E-Filing Möglichkeiten`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          forms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                form_name: { type: "string" },
                form_number: { type: "string" },
                required: { type: "boolean" },
                data_fields: { type: "array", items: { type: "string" } },
                e_filing_possible: { type: "boolean" }
              }
            }
          },
          filing_method: { type: "string" },
          estimated_completion_hours: { type: "number" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      auto_generated_forms: forms
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});