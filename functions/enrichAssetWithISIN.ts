import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { asset_id } = await req.json();

    const asset = await base44.asServiceRole.entities.AssetPortfolio.get(asset_id);

    if (!asset.isin) {
      return Response.json({ success: false, message: "No ISIN provided" });
    }

    try {
      // OpenFIGI API für ISIN-Lookup
      const figiResponse = await fetch("https://api.openfigi.com/v3/mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{
          idType: "ID_ISIN",
          idValue: asset.isin
        }])
      });

      const figiData = await figiResponse.json();

      if (figiData[0]?.data?.[0]) {
        const securityInfo = figiData[0].data[0];

        // Asset Details anreichern
        const enrichedDetails = {
          ...asset.asset_details,
          security_type: securityInfo.securityType,
          market_sector: securityInfo.marketSector,
          security_description: securityInfo.securityDescription,
          composite_figi: securityInfo.compositeFIGI,
          exchange_code: securityInfo.exchCode
        };

        // Automatische Kategorisierung
        let autoCategory = asset.asset_category;
        if (securityInfo.securityType === "Common Stock") {
          autoCategory = "STOCKS";
        } else if (securityInfo.securityType === "ETF") {
          autoCategory = "FUNDS";
        } else if (securityInfo.securityType?.includes("Bond")) {
          autoCategory = "BONDS";
        }

        // API-Symbol bestimmen
        let apiSymbol = asset.api_symbol;
        if (securityInfo.ticker && securityInfo.exchCode) {
          if (securityInfo.exchCode === "GY") {
            apiSymbol = securityInfo.ticker + ".DE";
          } else if (securityInfo.exchCode === "US") {
            apiSymbol = securityInfo.ticker;
          } else {
            apiSymbol = securityInfo.ticker;
          }
        }

        // Asset aktualisieren
        await base44.asServiceRole.entities.AssetPortfolio.update(asset.id, {
          asset_category: autoCategory,
          asset_details: enrichedDetails,
          api_symbol: apiSymbol,
          auto_categorized: true,
          sector: securityInfo.marketSector,
          last_analysis_date: new Date().toISOString()
        });

        return Response.json({
          success: true,
          message: "Asset enriched successfully",
          category: autoCategory,
          api_symbol: apiSymbol
        });
      }

      return Response.json({
        success: false,
        message: "ISIN not found in FIGI database"
      });
    } catch (error) {
      console.error("ISIN enrichment failed:", error);
      return Response.json({ success: false, message: error.message }, { status: 500 });
    }
  } catch (error) {
    console.error("enrichAssetWithISIN error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});