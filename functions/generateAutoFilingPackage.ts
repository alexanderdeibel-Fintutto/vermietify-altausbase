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

    // Generate Auto-Filing Package (PDFs, XMLs, etc.)
    const package_data = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle komplettes Auto-Filing Package für ${user.email} in ${country} (${tax_year}):

TAX DATA:
${JSON.stringify(calculation?.calculation_data || {}, null, 2)}

COUNTRY: ${country}
FILING METHOD: ${country === 'DE' ? 'ELSTER' : country === 'AT' ? 'Finanzonline' : 'Zefix/Online'}

GENERATE:
1. Tax Form PDFs (all required)
2. XML for E-Filing
3. Summary Sheet
4. Documentation Checklist
5. Payment Instructions
6. Filing Deadlines
7. QR Codes for payments

FORMAT:
- PDF for signing
- XML for e-filing
- Metadata for tracking`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          forms_included: { type: "array", items: { type: "string" } },
          package_format: { type: "string" },
          filing_method: { type: "string" },
          ready_for_eFiling: { type: "boolean" },
          estimated_tax_due: { type: "number" },
          payment_deadline: { type: "string" },
          file_checksums: { type: "object" }
        }
      }
    });

    // Erstelle Filing Record
    const filing = await base44.entities.TaxFiling.create({
      user_email: user.email,
      tax_year,
      country,
      status: 'prepared',
      filing_method: country === 'DE' ? 'elster' : 'manual',
      forms_prepared: package_data.forms_included,
      estimated_tax: calculation?.total_tax,
      filing_deadline: package_data.payment_deadline
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      filing_package: package_data,
      filing_id: filing.id
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});