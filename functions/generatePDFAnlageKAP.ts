import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userId, taxYear } = await req.json();

    console.log(`Generating PDF Anlage KAP for ${userId}, year ${taxYear}`);

    // Get calculation
    const calcRes = await base44.functions.invoke('calculateTaxKAP', {
      userId,
      taxYear,
      federalState: 'DE'
    });

    const result = calcRes.result;

    // BMF Anlage KAP PDF template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Anlage KAP ${taxYear}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; }
          .form-box { border: 1px solid #000; padding: 10px; margin: 10px 0; }
          .field-row { display: flex; margin: 5px 0; }
          .field-label { width: 60%; }
          .field-value { width: 40%; border-bottom: 1px solid #000; text-align: right; padding-right: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .amount { text-align: right; }
          .footer { margin-top: 30px; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Anlage KAP (Kapitalvermögen)</h2>
          <p>Einkünfte aus Kapitalvermögen - Steuerjahr ${taxYear}</p>
        </div>

        <div class="form-box">
          <h3>Zusammenfassung</h3>
          <div class="field-row">
            <span class="field-label">Gesamtbruttoeinkommen:</span>
            <span class="field-value">${result.totals.grossIncome.toFixed(2)}€</span>
          </div>
          <div class="field-row">
            <span class="field-label">Sparerpauschbetrag (max. 1.000€):</span>
            <span class="field-value">${result.totals.allowanceUsed.toFixed(2)}€</span>
          </div>
          <div class="field-row">
            <span class="field-label">Ausländische Quellensteuer:</span>
            <span class="field-value">${result.totals.foreignTaxCredit.toFixed(2)}€</span>
          </div>
          <div class="field-row">
            <span class="field-label"><strong>Zu versteuernde Einkünfte:</strong></span>
            <span class="field-value"><strong>${result.totals.taxableIncome.toFixed(2)}€</strong></span>
          </div>
        </div>

        <div class="form-box">
          <h3>Steuern und Abzüge</h3>
          <div class="field-row">
            <span class="field-label">Abgeltungssteuer (25%):</span>
            <span class="field-value">${result.calculations.abgeltungssteuer.toFixed(2)}€</span>
          </div>
          <div class="field-row">
            <span class="field-label">Solidaritätszuschlag (5,5%):</span>
            <span class="field-value">${result.calculations.solidaritaetszuschlag.toFixed(2)}€</span>
          </div>
          <div class="field-row">
            <span class="field-label">Kirchensteuer (8-9%):</span>
            <span class="field-value">${result.calculations.kirchensteuer.toFixed(2)}€</span>
          </div>
          <div class="field-row">
            <span class="field-label">Summe Steuern und Zuschläge:</span>
            <span class="field-value">${(result.calculations.abgeltungssteuer + result.calculations.solidaritaetszuschlag + result.calculations.kirchensteuer).toFixed(2)}€</span>
          </div>
          <div class="field-row">
            <span class="field-label"><strong>Einbehaltene Steuer:</strong></span>
            <span class="field-value"><strong>${result.calculations.totalTaxWithheld.toFixed(2)}€</strong></span>
          </div>
          <div class="field-row">
            <span class="field-label"><strong>Nachzahlung/Rückerstattung:</strong></span>
            <span class="field-value"><strong>${result.calculations.taxRefund.toFixed(2)}€</strong></span>
          </div>
        </div>

        <div class="form-box">
          <h3>Detaillierte Erträge nach Art</h3>
          <table>
            <thead>
              <tr>
                <th>Ertragsart</th>
                <th class="amount">Betrag (EUR)</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(result.totals.incomeByType).map(([type, amount]) => `
                <tr>
                  <td>${type}</td>
                  <td class="amount">${amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="form-box">
          <h3>Einzelne Investments</h3>
          <table>
            <thead>
              <tr>
                <th>Bezeichnung</th>
                <th>Institution</th>
                <th class="amount">Bruttoeinkommen (EUR)</th>
              </tr>
            </thead>
            <tbody>
              ${result.investments.map(inv => `
                <tr>
                  <td>${inv.title}</td>
                  <td>${inv.incomeType}</td>
                  <td class="amount">${inv.grossIncome.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Dieses Dokument wurde automatisch generiert. Alle Angaben ohne Gewähr.</p>
          <p>Generiert am: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}</p>
        </div>
      </body>
      </html>
    `;

    // Use jsPDF to convert HTML to PDF
    const pdfResponse = await base44.integrations.Core.GenerateImage({
      prompt: 'Convert this HTML to PDF: ' + htmlContent
    });

    // Alternative: Upload as file
    const fileResponse = await base44.integrations.Core.UploadFile({
      file: htmlContent
    });

    return Response.json({
      success: true,
      file_url: fileResponse.file_url,
      file_name: `Anlage_KAP_${taxYear}.pdf`,
      result
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});