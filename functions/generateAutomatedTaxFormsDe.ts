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
      country: 'DE',
      tax_year
    }, '-updated_date', 1))[0];

    const capitalGains = await base44.entities.CapitalGain.filter({
      user_email: user.email
    });

    // Generate DE-specific tax forms (Anlagen etc. for ELSTER)
    const forms = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere deutsche Steuererklärungsformulare (${tax_year}) für ELSTER:

PROFIL:
${JSON.stringify(profile, null, 2)}

BERECHNUNG:
${JSON.stringify(calculation?.calculation_data, null, 2)}

ASSETS:
- Capital Gains: ${capitalGains.length}

ERSTELLE FORMULARE:
1. Anlage N (Einkünfte aus Nichtselbstständigkeit)
2. Anlage KAP (Kapitalerträge)
${profile?.business_entities?.length > 0 ? '3. Anlage S (Gewinn aus Betrieb)' : ''}
${capitalGains.length > 0 ? '4. Anlage G (Gewinne aus Kapitalvermögen)' : ''}

PRO FORM:
- Steuernummer-Felder (ELSTER-relevant)
- Plausibilitätsprüfungen der Finanzbehörde
- Abschreibungsregeln
- Progression
- XML-Export-ready data

FORMAT: JSON ELSTER-kompatibel`,
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
                elster_form_code: { type: "string" },
                fields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field_id: { type: "string" },
                      field_name: { type: "string" },
                      value: { type: "number" },
                      tax_id: { type: "string" }
                    }
                  }
                },
                xml_export_data: { type: "object" }
              }
            }
          },
          elster_ready: { type: "boolean" },
          submission_deadline: { type: "string" }
        }
      }
    });

    // Save generated forms
    for (const form of forms.forms || []) {
      await base44.entities.TaxForm.create({
        user_email: user.email,
        country: 'DE',
        tax_year,
        form_type: form.form_id,
        form_name: form.form_name,
        form_data: form.fields,
        xml_data: form.xml_export_data,
        status: 'draft'
      });
    }

    return Response.json({
      user_email: user.email,
      country: 'DE',
      tax_year,
      forms_generated: forms.forms?.length || 0,
      elster_ready: forms.elster_ready,
      submission_deadline: forms.submission_deadline
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});