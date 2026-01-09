import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      portfolioId,
      userId,
      format,
      sections,
      audience,
      includePersonalData
    } = await req.json();

    console.log(`Generating ${format} report for portfolio ${portfolioId}`);

    // Get portfolio data
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      id: portfolioId
    });

    if (!assets || assets.length === 0) {
      return Response.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const asset = assets[0];
    const totalValue = asset.quantity * asset.current_value;
    const costBasis = asset.quantity * asset.purchase_price;
    const gain = totalValue - costBasis;

    // Build report content
    let reportContent = {};

    if (sections.includes('summary')) {
      reportContent.summary = {
        portfolioValue: totalValue,
        costBasis,
        gain,
        gainPercent: (gain / costBasis) * 100
      };
    }

    if (sections.includes('performance')) {
      const history = await base44.asServiceRole.entities.PriceHistory.filter({
        asset_portfolio_id: asset.id
      }, '-recorded_at', 30);

      reportContent.performance = {
        priceHistory: history.map(h => ({
          date: h.recorded_at,
          price: h.price
        }))
      };
    }

    if (sections.includes('tax')) {
      reportContent.tax = {
        form_type: 'anlage_kap',
        gains: gain,
        realizableGains: gain > 0 ? gain : 0
      };
    }

    // Generate based on format
    let fileUrl = '';

    if (format === 'pdf') {
      // Generate PDF
      const htmlContent = generateHTML(reportContent, asset, audience);
      const pdfResponse = await base44.functions.invoke('generatePDF', {
        html: htmlContent,
        fileName: `Portfolio_Report_${new Date().toISOString().split('T')[0]}.pdf`
      });
      fileUrl = pdfResponse.file_url;
    } else if (format === 'excel') {
      // Generate Excel
      const excelResponse = await base44.functions.invoke('generateExcel', {
        data: reportContent,
        fileName: `Portfolio_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      });
      fileUrl = excelResponse.file_url;
    } else if (format === 'elster') {
      // Generate ELSTER XML
      const xmlContent = generateElsterXML(reportContent, asset);
      const response = await base44.integrations.Core.UploadFile({
        file: xmlContent
      });
      fileUrl = response.file_url;
    }

    // Log report generation
    await base44.asServiceRole.entities.TeamActivityLog.create({
      portfolio_id: portfolioId,
      user_id: userId,
      action_type: 'export_requested',
      entity_type: 'AssetPortfolio',
      entity_id: portfolioId,
      description: `${format.toUpperCase()}-Report erstellt (${sections.join(', ')})`,
      visibility: 'owner'
    });

    return Response.json({
      success: true,
      file_url: fileUrl,
      format,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateHTML(report, asset, audience) {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Portfolio Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .section { margin: 30px 0; }
        .footer { margin-top: 40px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <h1>Portfolio Report</h1>
      <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
      <p>Zielgruppe: ${audience}</p>
      
      ${report.summary ? `
        <div class="section">
          <h2>Portfolio-Übersicht</h2>
          <table>
            <tr>
              <th>Metrik</th>
              <th>Wert</th>
            </tr>
            <tr>
              <td>Gesamtwert</td>
              <td>${report.summary.portfolioValue.toFixed(2)} EUR</td>
            </tr>
            <tr>
              <td>Kostenasis</td>
              <td>${report.summary.costBasis.toFixed(2)} EUR</td>
            </tr>
            <tr>
              <td>Gewinn/Verlust</td>
              <td>${report.summary.gain.toFixed(2)} EUR (${report.summary.gainPercent.toFixed(2)}%)</td>
            </tr>
          </table>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>Dieser Report wurde automatisch generiert. Alle Angaben ohne Gewähr.</p>
      </div>
    </body>
    </html>
  `;
}

function generateElsterXML(report, asset) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ElsterReport>
  <Portfolio>
    <Asset>${asset.name}</Asset>
    <Value>${(asset.quantity * asset.current_value).toFixed(2)}</Value>
    <Gains>${report.tax?.realizableGains || 0}</Gains>
  </Portfolio>
</ElsterReport>`;
}