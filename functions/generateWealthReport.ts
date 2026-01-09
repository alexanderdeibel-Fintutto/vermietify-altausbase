import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taxYear, canton } = await req.json();

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    console.log(`Generating wealth report for ${taxYear}`);

    // Fetch all data
    const [investmentsDE, investmentsAT, investmentsCH, realEstateCH] = await Promise.all([
      base44.entities.Investment.filter({ tax_year: taxYear }) || [],
      base44.entities.InvestmentAT.filter({ tax_year: taxYear }) || [],
      base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [],
      base44.entities.RealEstateCH.filter({ tax_year: taxYear, canton }) || []
    ]);

    // Calculate totals
    const deTotal = investmentsDE.reduce((sum, inv) => sum + (inv.quantity * inv.current_value || 0), 0);
    const atTotal = investmentsAT.reduce((sum, inv) => sum + inv.gross_income, 0);
    const chInvTotal = investmentsCH.reduce((sum, inv) => sum + (inv.quantity * inv.current_value || 0), 0);
    const chRealTotal = realEstateCH.reduce((sum, re) => sum + re.current_market_value, 0);

    const report = {
      taxYear,
      generatedAt: new Date().toISOString(),
      user: user.full_name,
      summary: {
        germany: { total: deTotal, positions: investmentsDE.length },
        austria: { total: atTotal, positions: investmentsAT.length },
        switzerland: { total: chInvTotal + chRealTotal, positions: investmentsCH.length + realEstateCH.length }
      },
      details: {
        investmentsDE,
        investmentsAT,
        investmentsCH,
        realEstateCH
      }
    };

    // Generate HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Wealth Report ${taxYear}</title>
        <style>
          body { font-family: Arial; margin: 40px; }
          h1 { color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          td, th { padding: 10px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #f0f0f0; }
          .total { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>🌍 DACH Wealth Report ${taxYear}</h1>
        <p><strong>Report für:</strong> ${user.full_name}</p>
        <p><strong>Generiert:</strong> ${new Date().toLocaleDateString('de-DE')}</p>

        <h2>Zusammenfassung</h2>
        <table>
          <tr><th>Land</th><th>Vermögen</th><th>Positionen</th></tr>
          <tr><td>🇩🇪 Deutschland</td><td class="total">€${deTotal.toFixed(0)}</td><td>${investmentsDE.length}</td></tr>
          <tr><td>🇦🇹 Österreich</td><td class="total">€${atTotal.toFixed(0)}</td><td>${investmentsAT.length}</td></tr>
          <tr><td>🇨🇭 Schweiz</td><td class="total">CHF ${(chInvTotal + chRealTotal).toFixed(0)}</td><td>${investmentsCH.length + realEstateCH.length}</td></tr>
        </table>
      </body>
      </html>
    `;

    // Upload report
    const uploadRes = await base44.integrations.Core.UploadFile({
      file: htmlContent
    });

    return Response.json({
      success: true,
      filename: `wealth-report-${taxYear}.html`,
      file_url: uploadRes.file_url,
      report
    });

  } catch (error) {
    console.error('Report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});