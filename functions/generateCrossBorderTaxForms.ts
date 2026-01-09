import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, primary_country } = await req.json();

    // Get cross-border calculation
    const calculation = (await base44.entities.TaxCalculation.filter(
      { user_email: user.email, country: primary_country, tax_year },
      '-updated_date',
      1
    ))[0];

    // Generate country-specific forms based on distribution
    const forms = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere notwendige Tax Forms für Cross-Border Situation:

CALCULATION DATA:
${JSON.stringify(calculation?.calculation_data, null, 2)}

PRIMARY: ${primary_country}
TAX YEAR: ${tax_year}

COUNTRY-SPECIFIC FORMS:

${primary_country === 'DE' ? `
GERMANY:
- Anlage SO (Foreign Income)
- Anlage KAP (Capital Gains)
- Anlage V (Rental if applicable)
- Anlage AUS (Foreign Assets if > threshold)
` : primary_country === 'CH' ? `
SWITZERLAND:
- Main Tax Return (Steuererklarung)
- International Transactions Annex
- Double Taxation Relief Claim
` : `
AUSTRIA:
- Einkommensteuererklarung
- Anlage Ausland (Foreign Income)
- Vermoegensanrechnung (if needed)
`}

GENERATE:
1. Required Forms List
2. Form Fields to Fill (pre-populated where possible)
3. Treaty Documents Needed
4. Filing Instructions
5. Deadline per Country

FOKUS auf Treaty Compliance & Withholding Tax Documentation`,
      response_json_schema: {
        type: "object",
        properties: {
          required_forms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                form_name: { type: "string" },
                country: { type: "string" },
                deadline: { type: "string" },
                pdf_url: { type: "string" },
                pre_filled_fields: { type: "object" }
              }
            }
          },
          treaty_documents: { type: "array", items: { type: "string" } },
          withholding_tax_documentation: { type: "array", items: { type: "string" } },
          filing_checklist: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Save forms for user
    for (const form of forms.required_forms || []) {
      await base44.entities.TaxForm.create({
        user_email: user.email,
        tax_year,
        country: form.country,
        form_name: form.form_name,
        deadline: form.deadline,
        status: 'pending',
        pre_filled_data: form.pre_filled_fields
      });
    }

    return Response.json({
      user_email: user.email,
      country: primary_country,
      tax_year,
      required_forms: forms.required_forms?.length || 0,
      forms: forms
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});