import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SPEKULATIONSFRIST_TAGE = 365;

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

    // Krypto-Assets
    const cryptoAssets = await base44.entities.Asset.filter({ asset_class: 'crypto' });
    const cryptoAssetIds = cryptoAssets.map(a => a.id);

    const accounts = await base44.entities.PortfolioAccount.filter({ portfolio_id: portfolioId });
    const accountIds = accounts.map(a => a.id);

    const sales = [];
    let totalGainShortTerm = 0;
    let totalGainLongTerm = 0;
    let totalLoss = 0;

    // Alle Verkäufe
    for (const assetId of cryptoAssetIds) {
      const sellTxs = await base44.asServiceRole.entities.AssetTransaction.list();
      
      for (const sellTx of sellTxs) {
        if (
          !accountIds.includes(sellTx.portfolio_account_id) ||
          sellTx.asset_id !== assetId ||
          sellTx.transaction_type !== 'sell' ||
          sellTx.transaction_date < startDate ||
          sellTx.transaction_date > endDate
        ) continue;

        // Kauftransaktionen laden (FIFO)
        const buyTxs = await base44.asServiceRole.entities.AssetTransaction.filter({
          portfolio_account_id: sellTx.portfolio_account_id,
          asset_id: assetId,
          transaction_type: 'buy'
        });
        buyTxs.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));

        let remainingQuantity = Math.abs(sellTx.quantity);
        let totalCostBasis = 0;

        for (const buyTx of buyTxs) {
          if (remainingQuantity <= 0) break;

          const available = buyTx.quantity;
          const taken = Math.min(available, remainingQuantity);
          const costBasis = (buyTx.net_amount / buyTx.quantity) * taken;
          
          totalCostBasis += costBasis;
          remainingQuantity -= taken;

          // Spekulationsfrist prüfen
          const daysDiff = (new Date(sellTx.transaction_date) - new Date(buyTx.transaction_date)) / (1000 * 60 * 60 * 24);
          const isLongTerm = daysDiff > SPEKULATIONSFRIST_TAGE;

          const proceeds = (sellTx.net_amount / Math.abs(sellTx.quantity)) * taken;
          const gain = proceeds - costBasis;

          if (gain > 0) {
            if (isLongTerm) {
              totalGainLongTerm += gain;
            } else {
              totalGainShortTerm += gain;
            }
          } else {
            totalLoss += Math.abs(gain);
          }

          sales.push({
            asset: cryptoAssets.find(a => a.id === assetId)?.symbol,
            buyDate: buyTx.transaction_date,
            sellDate: sellTx.transaction_date,
            quantity: taken,
            costBasis,
            proceeds,
            gain,
            isLongTerm,
            daysDiff: Math.round(daysDiff)
          });
        }
      }
    }

    // § 23 EStG - Private Veräußerungsgeschäfte
    const taxableGain = Math.max(0, totalGainShortTerm - totalLoss);
    const freigrenze = 600; // Freigrenze (nicht Freibetrag!)

    return Response.json({
      success: true,
      year,
      kryptowaehrungen: {
        kurzfristige_gewinne: totalGainShortTerm,
        langfristige_gewinne: totalGainLongTerm,
        verluste: totalLoss,
        zu_versteuern: taxableGain > freigrenze ? taxableGain : 0
      },
      freigrenze,
      hinweis: taxableGain > 0 && taxableGain <= freigrenze 
        ? 'Unter Freigrenze - nicht steuerpflichtig'
        : taxableGain > freigrenze
        ? 'Über Freigrenze - vollständig steuerpflichtig mit persönlichem Steuersatz'
        : 'Keine steuerpflichtigen Gewinne',
      detaillierte_veraeusserungen: sales
    });
  } catch (error) {
    console.error('Crypto tax calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});