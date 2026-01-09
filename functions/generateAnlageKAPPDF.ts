import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generiert deutsches Steuerformular "Anlage KAP" (Kapitalerträge) als PDF
 * Aggregiert Gewinn/Verlust aus Assets und füllt Formularfelder
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await req.json();

    if (!year) {
      return Response.json(
        { error: 'year erforderlich' },
        { status: 400 }
      );
    }

    // Alle Assets des Nutzers laden
    const assets = await base44.entities.AssetPortfolio.filter(
      { user_id: user.id },
      '',
      5000
    );

    // Gewinn/Verlust berechnen
    let totalGains = 0;
    let totalLosses = 0;
    const gainsByType = {};

    for (const asset of assets) {
      const totalInvested = asset.quantity * asset.purchase_price;
      const totalValue = asset.quantity * asset.current_value;
      const gain = totalValue - totalInvested;

      const assetType = asset.asset_category || 'other';
      gainsByType[assetType] = (gainsByType[assetType] || 0) + gain;

      if (gain > 0) {
        totalGains += gain;
      } else if (gain < 0) {
        totalLosses += Math.abs(gain);
      }
    }

    // Tax Loss Carryforward laden
    const carryforwards = await base44.entities.TaxLossCarryforward.filter(
      { user_id: user.id },
      '-year',
      10
    );

    const carryforwardUsed = carryforwards
      .filter(cf => cf.year < year)
      .reduce((sum, cf) => sum + (cf.remaining_amount || 0), 0);

    // Formular-Daten zusammenstellen
    const formData = {
      year,
      user_name: user.full_name,
      user_email: user.email,
      // Zeile 5 - Einkünfte aus Dividenden
      line5_dividends: gainsByType.stocks || 0,
      // Zeile 6 - Einkünfte aus Kapitalerträgen
      line6_capital_gains: totalGains,
      // Zeile 7 - Verluste aus Kapitalanlagen
      line7_losses: totalLosses,
      // Zeile 8 - Verlustvortrag
      line8_carryforward: carryforwardUsed,
      // Endsumme (Gewinn nach Verlust)
      net_gain: Math.max(0, totalGains - totalLosses - carryforwardUsed),
      // Details
      assets_count: assets.length,
      report_date: new Date().toISOString().split('T')[0]
    };

    // Einfacher HTML-zu-PDF-String (würde normalerweise jsPDF oder Puppeteer nutzen)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Anlage KAP ${year}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { font-size: 16px; font-weight: bold; margin-bottom: 20px; }
          .form-section { margin: 15px 0; padding: 10px; border: 1px solid #ccc; }
          .form-line { display: flex; justify-content: space-between; margin: 8px 0; }
          .label { flex: 1; }
          .value { width: 150px; text-align: right; font-family: monospace; }
          .total { font-weight: bold; background: #f0f0f0; padding: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          Anlage KAP - Einkünfte aus Kapitalvermögen ${year}
        </div>
        
        <div class="form-section">
          <h3>Persönliche Angaben</h3>
          <div class="form-line">
            <span class="label">Name:</span>
            <span class="value">${formData.user_name}</span>
          </div>
          <div class="form-line">
            <span class="label">Email:</span>
            <span class="value">${formData.user_email}</span>
          </div>
        </div>

        <div class="form-section">
          <h3>Kapitalerträge</h3>
          <div class="form-line">
            <span class="label">Zeile 5 - Dividenden (€):</span>
            <span class="value">${formData.line5_dividends.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
          </div>
          <div class="form-line">
            <span class="label">Zeile 6 - Kursgewinne (€):</span>
            <span class="value">${formData.line6_capital_gains.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
          </div>
          <div class="form-line">
            <span class="label">Zeile 7 - Kursverluste (€):</span>
            <span class="value">-${formData.line7_losses.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
          </div>
          <div class="form-line">
            <span class="label">Zeile 8 - Verlustvortrag (€):</span>
            <span class="value">-${formData.line8_carryforward.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
          </div>
          <div class="form-line total">
            <span class="label">Endsumme (€):</span>
            <span class="value">${formData.net_gain.toLocaleString('de-DE', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="form-section">
          <h3>Zusammenfassung</h3>
          <div class="form-line">
            <span class="label">Anzahl Positionen:</span>
            <span class="value">${formData.assets_count}</span>
          </div>
          <div class="form-line">
            <span class="label">Erstellungsdatum:</span>
            <span class="value">${formData.report_date}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    // Activity Log
    await base44.entities.ActivityLog.create({
      user_id: user.id,
      action: 'tax_form_generated',
      entity_type: 'TaxForm',
      details: {
        form_type: 'Anlage KAP',
        year,
        total_gains: totalGains,
        total_losses: totalLosses,
        net_result: formData.net_gain
      }
    });

    return Response.json({
      success: true,
      year,
      form_type: 'Anlage KAP',
      form_data: formData,
      html_content: htmlContent,
      message: 'Steuererklärung generiert. PDF-Export würde über jsPDF erfolgen.'
    });

  } catch (error) {
    console.error('Tax form generation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});