import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();

    // Get user tax data
    const profile = (await base44.entities.TaxProfile.filter(
      { user_email: user.email },
      '-updated_date',
      1
    ))[0];

    const calculation = (await base44.entities.TaxCalculation.filter({
      user_email: user.email,
      country: 'AT',
      tax_year
    }, '-updated_date', 1))[0];

    const investments = await base44.entities.InvestmentAT.filter({
      user_email: user.email
    });

    const otherIncome = await base44.entities.OtherIncomeAT.filter({
      user_email: user.email,
      tax_year
    });

    // Generate AT-specific tax forms (E1c, etc.)
    const forms = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere österreichische Steuererklärungsformulare (${tax_year}):

PROFIL:
${JSON.stringify(profile, null, 2)}

BERECHNUNG:
${JSON.stringify(calculation?.calculation_data, null, 2)}

ASSETS:
- Investments: ${investments.length}
- Other Income Items: ${otherIncome.length}

ERSTELLE FORMULARE:
1. Arbeitnehmerantrag (Formular L1)
2. Anlage E1c (Einkünfte aus Gewerbebetrieb)
${investments.length > 0 ? '3. Anlage KAP (Kapitalerträge)' : ''}
${otherIncome.length > 0 ? '4. Anlage SO (Sonstige Einkünfte)' : ''}

PRO FORM:
- Form ID (z.B. "AT-L1")
- Required Fields
- Pre-filled values from calculation
- Validation rules
- FinanzOnline-relevant data

FORMAT: JSON mit Formularfeldern & Plausibilitätsregeln`,
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
                form_type_code: { type: "string" },
                fields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field_id: { type: "string" },
                      field_name: { type: "string" },
                      value: { type: "number" },
                      validation_rule: { type: "string" }
                    }
                  }
                }
              }
            }
          },
          finanzonline_ready: { type: "boolean" },
          validation_errors: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Save generated forms
    for (const form of forms.forms || []) {
      await base44.entities.TaxForm.create({
        user_email: user.email,
        country: 'AT',
        tax_year,
        form_type: form.form_id,
        form_name: form.form_name,
        form_data: form.fields,
        status: 'draft'
      });
    }

    return Response.json({
      user_email: user.email,
      country: 'AT',
      tax_year,
      forms_generated: forms.forms?.length || 0,
      finanzonline_ready: forms.finanzonline_ready,
      validation_errors: forms.validation_errors
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});