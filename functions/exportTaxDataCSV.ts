import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { tax_year } = await req.json();
    
    console.log(`[CSV Export] Generating tax data for ${tax_year}`);
    
    // Alle steuerrelevanten Transaktionen
    const transactions = await base44.entities.AssetTransaction.filter({
      tax_year,
      tax_relevant: true
    });
    
    // Alle Dividenden
    const dividends = await base44.entities.Dividend.filter({ tax_year });
    
    // Assets abrufen für Namen
    const assets = await base44.entities.Asset.list();
    const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));
    
    // CSV Header
    let csv = 'Datum;Typ;Asset;ISIN;Menge;Preis;Gesamtbetrag;Gebühren;Gewinn/Verlust;Steuerpflichtig\n';
    
    // Transaktionen
    for (const tx of transactions) {
      const asset = assetMap[tx.asset_id];
      csv += `${tx.transaction_date};${tx.transaction_type};${asset?.name || 'Unbekannt'};${asset?.isin || ''};${tx.quantity};${tx.price_per_unit};${tx.total_amount};${tx.fees || 0};${tx.realized_gain_loss || 0};Ja\n`;
    }
    
    // Dividenden
    for (const div of dividends) {
      const asset = assetMap[div.asset_id];
      csv += `${div.payment_date};DIVIDEND;${asset?.name || 'Unbekannt'};${asset?.isin || ''};-;-;${div.amount_gross};${div.tax_withheld || 0};${div.amount_net};Ja\n`;
    }
    
    // Zusammenfassung hinzufügen
    csv += '\n\nZusammenfassung\n';
    csv += `Steuerjahr;${tax_year}\n`;
    csv += `Dividenden gesamt;${dividends.reduce((s, d) => s + d.amount_gross, 0).toFixed(2)} €\n`;
    csv += `Kursgewinne gesamt;${transactions.reduce((s, t) => s + (t.realized_gain_loss || 0), 0).toFixed(2)} €\n`;
    csv += `Transaktionen;${transactions.length}\n`;
    csv += `Dividendenzahlungen;${dividends.length}\n`;
    
    console.log(`[CSV Export] Generated ${transactions.length + dividends.length} rows`);
    
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=Steuerrelevante_Transaktionen_${tax_year}.csv`
      }
    });
  } catch (error) {
    console.error('[CSV Export] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});