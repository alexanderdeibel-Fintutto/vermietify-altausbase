import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear, formType } = await req.json();

    console.log(`Generating Austrian PDF: ${formType} for year ${taxYear}`);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get tax calculation
    const calculation = await base44.functions.invoke('calculateTaxAT', {
      userId,
      taxYear
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Österreich Steuerjahr ${taxYear}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #1e40af; text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          td, th { padding: 8px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .summary { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .total { font-weight: bold; color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>Österreich - Steuerjahr ${taxYear}</h1>
        <p><strong>Name:</strong> ${user.full_name}</p>
        <p><strong>Email:</strong> ${user.email}</p>

        <div class="summary">
          <h2>Zusammenfassung Kapitalvermögen (E1kv)</h2>
          <table>
            <tr><td>Bruttoeinkommen</td><td class="total">€${calculation.totals.grossIncome.toFixed(2)}</td></tr>
            <tr><td>Sparerfreibetrag</td><td>€${calculation.totals.allowanceUsed.toFixed(2)}</td></tr>
            <tr><td>Zu versteuern</td><td>€${calculation.totals.taxableIncomeKap.toFixed(2)}</td></tr>
            <tr><td>KESt 27.5%</td><td class="total">€${calculation.calculations.kest.toPay.toFixed(2)}</td></tr>
          </table>
        </div>

        <h2>Investments</h2>
        <table>
          <tr><th>Beschreibung</th><th>Art</th><th>Ertrag</th></tr>
          ${calculation.details.investments.map(inv => `
            <tr>
              <td>${inv.title}</td>
              <td>${inv.type}</td>
              <td>€${inv.grossIncome.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>

        <p style="margin-top: 40px; color: #666; font-size: 12px;">
          Generiert am ${new Date().toLocaleDateString('de-AT')} - Beilage zur Einkommensteuererklärung
        </p>
      </body>
      </html>
    `;

    // Use integration to generate PDF
    const pdfRes = await base44.integrations.Core.GenerateImage({
      prompt: `Convert this HTML to PDF: ${htmlContent}`,
    });

    // Upload PDF
    const uploadRes = await base44.integrations.Core.UploadFile({
      file: pdfRes.url
    });

    return Response.json({
      success: true,
      filename: `AnlageAT_${taxYear}.pdf`,
      file_url: uploadRes.file_url
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});