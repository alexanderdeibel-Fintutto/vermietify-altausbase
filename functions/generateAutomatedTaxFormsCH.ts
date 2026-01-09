import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, canton } = await req.json();

    // Get user tax data
    const profile = (await base44.entities.TaxProfile.filter(
      { user_email: user.email },
      '-updated_date',
      1
    ))[0];

    const calculation = (await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      country: 'CH',
      tax_year,
      canton
    }, '-updated_date', 1))[0];

    const crypto = await base44.entities.CryptoHolding.filter({
      user_email: user.email
    });

    const realEstate = await base44.entities.RealEstateCH.filter({
      user_email: user.email
    });

    // Generate CH-specific tax forms
    const forms = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere Schweizer Steuererklärungsformulare (${tax_year}, Kanton ${canton}):

PROFIL:
${JSON.stringify(profile, null, 2)}

BERECHNUNG:
${JSON.stringify(calculation?.calculation_data, null, 2)}

ASSETS:
- Crypto: ${crypto.length}
- Real Estate: ${realEstate.length}

ERSTELLE FORMULARE:
1. Vereinfachte Steuererklärung (falls applicable)
2. Vermögensblatt (Anlage Vermögen)
3. Einkünfte aus Liegenschaften (Anlage Liegenschaft)
${crypto.length > 0 ? '4. Kryptowährungen Formular (Kanton-spezifisch)' : ''}
${profile?.business_entities?.length > 0 ? '5. Geschäftstätigkeit' : ''}

PRO FORM:
- Form ID (z.B. "CH-11-001")
- Required Fields (mit Werten)
- Calculations
- Cross-references
- Canton-specific Rules

FORMAT: JSON mit allen ausfüllbaren Feldern`,
      response_json_schema: {
        type: "object",
        properties: {
          forms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                form_id: { type: "string" },
                form_name: { type: "string" },
                form_number: { type: "string" },
                fields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field_id: { type: "string" },
                      field_name: { type: "string" },
                      value: { type: "number" },
                      calculation_basis: { type: "string" }
                    }
                  }
                },
                total_value: { type: "number" }
              }
            }
          },
          total_tax_ch: { type: "number" },
          missing_documents: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Save generated forms
    for (const form of forms.forms || []) {
      await base44.entities.TaxForm.create({
        user_email: user.email,
        country: 'CH',
        tax_year,
        form_type: form.form_id,
        form_name: form.form_name,
        canton,
        form_data: form.fields,
        status: 'draft'
      });
    }

    return Response.json({
      user_email: user.email,
      country: 'CH',
      tax_year,
      canton,
      forms_generated: forms.forms?.length || 0,
      total_tax: forms.total_tax_ch,
      missing_docs: forms.missing_documents
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});