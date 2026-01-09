import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { asset_id } = await req.json();

    const asset = await base44.entities.AssetPortfolio.get(asset_id);

    if (!asset.isin) {
      return Response.json({ success: false, message: 'No ISIN provided' }, { status: 400 });
    }

    try {
      // OpenFIGI API für ISIN-Lookup (kostenlos)
      const response = await fetch('https://api.openfigi.com/v3/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ idType: 'ID_ISIN', idValue: asset.isin }])
      });

      const result = await response.json();
      const securityInfo = result[0]?.data?.[0];

      if (securityInfo) {
        const enrichedDetails = {
          ...asset.asset_details,
          security_type: securityInfo.securityType,
          market_sector: securityInfo.marketSector,
          security_description: securityInfo.securityDescription,
          exchange_code: securityInfo.exchCode
        };

        // Automatische Kategorisierung
        let autoCategory = asset.asset_category;
        if (securityInfo.securityType === 'Common Stock') {
          autoCategory = 'stocks';
        } else if (securityInfo.securityType === 'ETF') {
          autoCategory = 'funds';
        } else if (securityInfo.securityType?.includes('Bond')) {
          autoCategory = 'bonds';
        }

        // API-Symbol bestimmen
        let apiSymbol = asset.api_symbol;
        if (securityInfo.ticker) {
          if (securityInfo.exchCode === 'GY') {
            apiSymbol = securityInfo.ticker + '.DE';
          } else if (securityInfo.exchCode === 'US') {
            apiSymbol = securityInfo.ticker;
          }
        }

        await base44.entities.AssetPortfolio.update(asset_id, {
          asset_category: autoCategory,
          asset_details: enrichedDetails,
          api_symbol: apiSymbol,
          auto_categorized: true,
          sector: securityInfo.marketSector,
          last_analysis_date: new Date().toISOString()
        });

        return Response.json({
          success: true,
          category: autoCategory,
          api_symbol: apiSymbol
        });
      }

      return Response.json({ success: false, message: 'ISIN not found' });
    } catch (error) {
      return Response.json({ success: false, message: error.message }, { status: 400 });
    }
  } catch (error) {
    console.error('enrichAssetWithISIN error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});