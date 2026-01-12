import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPARERPAUSCHBETRAG = 1000; // 2024
const ABGELTUNGSSTEUER = 0.25;
const SOLI = 0.055;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { portfolioId, year = new Date().getFullYear() } = body;

    if (!portfolioId) {
      return Response.json({ error: 'portfolioId erforderlich' }, { status: 400 });
    }

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Alle Konten des Portfolios
    const accounts = await base44.entities.PortfolioAccount.filter({ portfolio_id: portfolioId });
    const accountIds = accounts.map(a => a.id);

    // Kapitalerträge sammeln
    let dividends = 0;
    let realizedGains = 0;
    let realizedLosses = 0;

    // Dividenden
    const dividendTxs = await base44.asServiceRole.entities.AssetTransaction.list();
    for (const tx of dividendTxs) {
      if (
        accountIds.includes(tx.portfolio_account_id) &&
        tx.transaction_type === 'dividend' &&
        tx.transaction_date >= startDate &&
        tx.transaction_date <= endDate
      ) {
        dividends += tx.net_amount;
      }
    }

    // Veräußerungsgewinne/-verluste
    const sellTxs = await base44.asServiceRole.entities.AssetTransaction.list();
    for (const tx of sellTxs) {
      if (
        accountIds.includes(tx.portfolio_account_id) &&
        tx.transaction_type === 'sell' &&
        tx.transaction_date >= startDate &&
        tx.transaction_date <= endDate
      ) {
        // Asset-Info für Teilfreistellung
        const asset = await base44.entities.Asset.read(tx.asset_id);
        let teilfreistellung = 0;

        if (asset.tax_category === 'equity_fund_30') {
          teilfreistellung = 0.30;
        } else if (asset.tax_category === 'mixed_fund_15') {
          teilfreistellung = 0.15;
        } else if (asset.tax_category === 'real_estate_fund_60') {
          teilfreistellung = 0.60;
        }

        // Berechne Gewinn/Verlust (vereinfacht - FIFO müsste aus Holdings kommen)
        const buyTxs = await base44.asServiceRole.entities.AssetTransaction.filter({
          portfolio_account_id: tx.portfolio_account_id,
          asset_id: tx.asset_id,
          transaction_type: 'buy'
        });
        
        if (buyTxs.length > 0) {
          const avgCost = buyTxs.reduce((sum, b) => sum + b.net_amount, 0) / 
                         buyTxs.reduce((sum, b) => sum + b.quantity, 0);
          const gain = tx.net_amount - (Math.abs(tx.quantity) * avgCost);
          const taxableGain = gain * (1 - teilfreistellung);

          if (taxableGain > 0) {
            realizedGains += taxableGain;
          } else {
            realizedLosses += Math.abs(taxableGain);
          }
        }
      }
    }

    // Gesamte Kapitalerträge
    const totalIncome = dividends + realizedGains;
    const netIncome = totalIncome - realizedLosses;
    const taxableIncome = Math.max(0, netIncome - SPARERPAUSCHBETRAG);
    
    const abgeltungssteuer = taxableIncome * ABGELTUNGSSTEUER;
    const solidaritaetszuschlag = abgeltungssteuer * SOLI;
    const totalTax = abgeltungssteuer + solidaritaetszuschlag;

    return Response.json({
      success: true,
      year,
      kapitalertraege: {
        dividenden: dividends,
        veraeusserungsgewinne: realizedGains,
        veraeusserungsverluste: realizedLosses,
        gesamt: totalIncome,
        netto: netIncome
      },
      sparerpauschbetrag: SPARERPAUSCHBETRAG,
      zu_versteuern: taxableIncome,
      steuern: {
        abgeltungssteuer,
        solidaritaetszuschlag,
        gesamt: totalTax
      }
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});