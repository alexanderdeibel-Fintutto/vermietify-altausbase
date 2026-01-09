import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, canton } = await req.json();

    console.log(`Generating Swiss PDF for canton ${canton}, year ${taxYear}`);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get tax calculation
    const calculation = await base44.functions.invoke('calculateTaxCH', {
      userId,
      taxYear,
      canton
    });

    const CANTONS = { ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', AG: 'Aargau', SG: 'Sankt Gallen', VS: 'Wallis', VD: 'Waadt', TI: 'Tessin', GE: 'Genf', BS: 'Basel-Stadt' };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Schweiz ${CANTONS[canton]} ${taxYear}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #1e40af; text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          td, th { padding: 8px; border: 1px solid #ddd; text-align: right; }
          th { background-color: #f3f4f6; font-weight: bold; text-align: left; }
          td:first-child, th:first-child { text-align: left; }
          .summary { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .total { font-weight: bold; color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>Schweiz - Kanton ${CANTONS[canton]} - Steuerjahr ${taxYear}</h1>
        <p><strong>Name:</strong> ${user.full_name}</p>

        <div class="summary">
          <h2>Vermögensübersicht</h2>
          <table>
            <tr><td>Wertschriften</td><td>CHF ${calculation.wealth.land.toFixed(0)}</td></tr>
            <tr><td>Liegenschaften</td><td>CHF ${calculation.wealth.buildings.toFixed(0)}</td></tr>
            <tr><td>Gesamtvermögen</td><td class="total">CHF ${calculation.wealth.total.toFixed(0)}</td></tr>
          </table>
        </div>

        <div class="summary">
          <h2>Steuern</h2>
          <table>
            <tr><td>Bundessteuer</td><td>CHF ${calculation.taxes.federalIncomeTax.toFixed(2)}</td></tr>
            <tr><td>Kantonssteuer</td><td>CHF ${calculation.taxes.cantonalIncomeTax.toFixed(2)}</td></tr>
            <tr><td>Vermögenssteuer</td><td>CHF ${(calculation.taxes.federalWealthTax + calculation.taxes.cantonalWealthTax).toFixed(2)}</td></tr>
            <tr><td>Einbehaltene Steuern</td><td>CHF -${calculation.taxes.withholdingTaxPaid.toFixed(2)}</td></tr>
            <tr><td class="total">Gesamtsteuer</td><td class="total">CHF ${calculation.taxes.totalDue.toFixed(2)}</td></tr>
          </table>
        </div>

        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          Generiert am ${new Date().toLocaleDateString('de-CH')} - Steuerdeklaration Kanton ${CANTONS[canton]}
        </p>
      </body>
      </html>
    `;

    // Generate PDF using integration
    const pdfRes = await base44.integrations.Core.GenerateImage({
      prompt: `Convert this HTML to PDF: ${htmlContent}`,
    });

    // Upload PDF
    const uploadRes = await base44.integrations.Core.UploadFile({
      file: pdfRes.url
    });

    return Response.json({
      success: true,
      filename: `Steuerjahr_${CANTONS[canton]}_${taxYear}.pdf`,
      file_url: uploadRes.file_url
    });

  } catch (error) {
    console.error('Swiss PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});