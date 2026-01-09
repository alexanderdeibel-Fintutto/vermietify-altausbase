import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear } = await req.json();

    if (!country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch all tax data
    const [filing, calculations, documents, investments, capitalGains, otherIncome] = await Promise.all([
      base44.entities.TaxFiling.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxCalculation.filter({ user_email: user.email, country, tax_year: taxYear }),
      base44.entities.TaxDocument.filter({ user_email: user.email, country, tax_year: taxYear }),
      country === 'DE' ? base44.entities.Investment.filter({ user_email: user.email }) : Promise.resolve([]),
      country === 'DE' ? base44.entities.CapitalGain.filter({ user_email: user.email, tax_year: taxYear }) : Promise.resolve([]),
      base44.entities.OtherIncome.filter({ user_email: user.email, tax_year: taxYear })
    ]);

    // Generate PDF content using LLM
    const pdfContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional tax return document for ${country} for tax year ${taxYear}.

User Data:
- Name: ${user.full_name}
- Email: ${user.email}
- Filing Status: ${filing[0]?.filing_type || 'individual'}

Tax Calculation Summary:
${calculations.map(c => `
- Income Tax: €${c.calculation_data?.income_tax || 0}
- Capital Gains Tax: €${c.calculation_data?.capital_gains_tax || 0}
- Total Tax: €${c.total_tax || 0}
- Withholding Paid: €${c.withholding_tax_paid || 0}
- Refund/Payment: €${c.tax_refund_or_payment || 0}
`).join('\n')}

Income Sources: ${otherIncome.length} sources documented
Investments: ${investments.length} positions tracked
Capital Gains: ${capitalGains.length} transactions
Supporting Documents: ${documents.length} documents collected

Generate a structured summary that could be used as a reference for tax preparation. Include sections for:
1. Taxpayer Information
2. Income Summary
3. Investment Income & Capital Gains
4. Tax Calculation
5. Payment Status
6. Documents Submitted

Format as a clear, professional document summary.`,
      response_json_schema: {
        type: 'object',
        properties: {
          document_title: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' }
              }
            }
          },
          summary: { type: 'string' }
        }
      }
    });

    // Create or update filing record
    const filingRecord = filing[0] || await base44.entities.TaxFiling.create({
      user_email: user.email,
      country,
      tax_year: taxYear,
      filing_type: 'individual',
      status: 'prepared',
      completion_percentage: 90
    });

    if (filing[0]) {
      await base44.entities.TaxFiling.update(filingRecord.id, {
        status: 'prepared',
        completion_percentage: 90,
        filing_data: pdfContent
      });
    }

    // Generate PDF
    const pdfResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Convert this tax return data into a PDF-ready format with headers, sections, and proper formatting:

${JSON.stringify(pdfContent, null, 2)}

Return the content formatted as plain text that would be suitable for conversion to PDF.`,
      response_json_schema: {
        type: 'object',
        properties: {
          pdf_content: { type: 'string' },
          metadata: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              author: { type: 'string' },
              created: { type: 'string' }
            }
          }
        }
      }
    });

    return Response.json({
      status: 'success',
      filing_id: filingRecord.id,
      document: pdfContent,
      pdf_ready: pdfResponse,
      message: 'Tax return document generated successfully'
    });
  } catch (error) {
    console.error('Tax return generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});