import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, documentType, country } = await req.json();

    if (!fileUrl || !documentType) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Use AI to extract data from document
    const extractionPrompt = `
      Analyze this tax document (${documentType}) from ${country} and extract key financial data.
      Return ONLY valid JSON with extracted values, no additional text.
      
      For bank statements: extract account number, bank name, statement date, balance, transactions
      For investment confirmations: extract ISIN, quantity, purchase price, current value
      For dividend slips: extract amount, date, dividend per share, tax withheld
      For tax certificates: extract gross income, tax withheld, tax year
      For receipts: extract date, vendor, amount, category
      For mortgage agreements: extract loan amount, interest rate, term
      For rental agreements: extract rent amount, property address, tenant/landlord
      
      Return: {"extracted_data": {...}, "confidence": 0-100, "warnings": [...]}
    `;

    const { data: extractedInfo } = await base44.integrations.Core.InvokeLLM({
      prompt: extractionPrompt,
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          extracted_data: {
            type: 'object',
            additionalProperties: true
          },
          confidence: { type: 'number' },
          warnings: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    return Response.json({
      status: 'success',
      extracted_data: extractedInfo.extracted_data || {},
      confidence: extractedInfo.confidence || 0,
      warnings: extractedInfo.warnings || []
    });
  } catch (error) {
    console.error('Document extraction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});