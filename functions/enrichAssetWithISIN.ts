import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { assetId, isin } = await req.json();

    console.log(`Enriching asset ${assetId} with ISIN ${isin}`);

    if (!isin) {
      return Response.json({ error: 'ISIN required' }, { status: 400 });
    }

    // Get asset
    const assets = await base44.asServiceRole.entities.AssetPortfolio.filter({
      id: assetId
    });

    if (!assets || assets.length === 0) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const asset = assets[0];

    try {
      // OpenFIGI API for ISIN lookup (free)
      const figiResponse = await fetch("https://api.openfigi.com/v3/mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{
          idType: "ID_ISIN",
          idValue: isin
        }])
      });

      const figiData = await figiResponse.json();

      if (figiData[0]?.data?.[0]) {
        const securityInfo = figiData[0].data[0];

        // Enrich asset details
        const enrichedDetails = {
          ...asset.asset_details,
          security_type: securityInfo.securityType,
          market_sector: securityInfo.marketSector,
          security_description: securityInfo.securityDescription,
          composite_figi: securityInfo.compositeFIGI,
          exchange_code: securityInfo.exchCode
        };

        // Auto-categorize
        let autoCategory = asset.asset_category;
        if (securityInfo.securityType === "Common Stock") {
          autoCategory = "STOCKS";
        } else if (securityInfo.securityType === "ETF") {
          autoCategory = "FUNDS";
        } else if (securityInfo.securityType?.includes("Bond")) {
          autoCategory = "BONDS";
        }

        // Determine API symbol
        let apiSymbol = asset.api_symbol;
        if (securityInfo.ticker && securityInfo.exchCode) {
          if (securityInfo.exchCode === "GY") {
            apiSymbol = securityInfo.ticker + ".DE";
          } else if (securityInfo.exchCode === "US") {
            apiSymbol = securityInfo.ticker;
          }
        }

        // Update asset
        await base44.asServiceRole.entities.AssetPortfolio.update(assetId, {
          asset_category: autoCategory,
          asset_details: enrichedDetails,
          api_symbol: apiSymbol,
          auto_categorized: true,
          sector: securityInfo.marketSector,
          last_analysis_date: new Date().toISOString()
        });

        console.log(`Asset enriched: category=${autoCategory}, symbol=${apiSymbol}`);

        return Response.json({
          success: true,
          category: autoCategory,
          api_symbol: apiSymbol,
          details: enrichedDetails
        });
      }

      return Response.json({ error: 'ISIN not found in database' }, { status: 404 });
    } catch (error) {
      console.error("ISIN enrichment error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  } catch (error) {
    console.error('Function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});