import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, building_id, tax_year } = await req.json();

    console.log('[EXCEL-IMPORT] Importing financial data from Excel');

    // Excel-Datei mit KI analysieren und strukturierte Daten extrahieren
    const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          entries: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                description: { type: "string" },
                amount: { type: "number" },
                category: { type: "string" },
                type: { type: "string", enum: ["INCOME", "EXPENSE"] }
              }
            }
          }
        }
      }
    });

    if (extractedData.status !== 'success') {
      return Response.json({ error: extractedData.details }, { status: 400 });
    }

    const imported = [];
    const failed = [];

    for (const entry of extractedData.output.entries || []) {
      try {
        // KI-Kategorisierung für jede Zeile
        const categorization = await base44.functions.invoke('categorizeExpenseWithAI', {
          invoice_data: {
            description: entry.description,
            amount: entry.amount,
            date: entry.date
          },
          building_ownership: 'VERMIETUNG',
          legal_form: 'PRIVATPERSON',
          historical_bookings: []
        });

        // FinancialItem erstellen
        const item = await base44.entities.FinancialItem.create({
          building_id,
          type: entry.type,
          amount: entry.amount,
          date: entry.date,
          description: entry.description,
          cost_category: categorization.data.categorization.suggested_category,
          tax_year,
          imported_from: 'excel',
          ai_confidence: categorization.data.categorization.confidence
        });

        imported.push(item.id);
      } catch (error) {
        failed.push({ entry, error: error.message });
      }
    }

    return Response.json({ 
      success: true, 
      imported_count: imported.length,
      failed_count: failed.length,
      failed
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});