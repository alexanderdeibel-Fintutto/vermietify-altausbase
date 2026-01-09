import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * finAPI Integration für Live-Kursdaten
 * Synchronisiert Wertpapierpreise via finAPI Securities Endpoint
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_ids } = await req.json();

    const clientId = Deno.env.get('FINAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');
    const baseUrl = Deno.env.get('FINAPI_BASE_URL');

    if (!clientId || !clientSecret || !baseUrl) {
      return Response.json(
        { error: 'finAPI nicht konfiguriert' },
        { status: 503 }
      );
    }

    // Token abrufen
    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenRes.ok) {
      throw new Error('finAPI token fetch failed');
    }

    const { access_token } = await tokenRes.json();

    // Assets laden
    const assets = await base44.entities.AssetPortfolio.filter(
      { user_id: user.id, status: 'active' },
      '',
      5000
    );

    const filteredAssets = asset_ids 
      ? assets.filter(a => asset_ids.includes(a.id))
      : assets;

    let updatedCount = 0;
    const errors = [];
    const priceUpdates = [];

    // Pro Asset: ISIN/WKN nutzen um Kurs zu holen
    for (const asset of filteredAssets) {
      if (!asset.isin && !asset.wkn) {
        errors.push({
          asset_id: asset.id,
          error: 'ISIN/WKN fehlt für Kurs-Abfrage'
        });
        continue;
      }

      try {
        // Securities endpoint
        const identifier = asset.isin || asset.wkn;
        const secRes = await fetch(
          `${baseUrl}/api/v1/securities?identifier=${identifier}`,
          {
            headers: { Authorization: `Bearer ${access_token}` }
          }
        );

        if (!secRes.ok) {
          throw new Error(`Securities lookup failed: ${secRes.status}`);
        }

        const { securities } = await secRes.json();

        if (!securities || securities.length === 0) {
          throw new Error('Wertpapier nicht gefunden');
        }

        const security = securities[0];
        const currentPrice = security.price || security.lastPrice;

        if (!currentPrice) {
          throw new Error('Aktueller Kurs nicht verfügbar');
        }

        // Asset aktualisieren
        await base44.entities.AssetPortfolio.update(asset.id, {
          current_value: currentPrice,
          last_updated: new Date().toISOString()
        });

        // Performance-Datensatz
        const totalValue = asset.quantity * currentPrice;
        const changePercent = asset.current_value 
          ? ((currentPrice - asset.current_value) / asset.current_value * 100)
          : 0;

        await base44.entities.AssetPerformanceHistory.create({
          asset_id: asset.id,
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          value_per_unit: currentPrice,
          total_value: totalValue,
          change_percent: changePercent,
          source: 'api'
        });

        priceUpdates.push({
          asset_id: asset.id,
          name: asset.name,
          old_price: asset.current_value,
          new_price: currentPrice,
          change_percent: changePercent.toFixed(2)
        });

        updatedCount++;

      } catch (error) {
        errors.push({
          asset_id: asset.id,
          name: asset.name,
          error: error.message
        });
      }
    }

    // Activity Log
    if (updatedCount > 0) {
      await base44.entities.ActivityLog.create({
        user_id: user.id,
        action: 'asset_updated',
        entity_type: 'AssetPortfolio',
        details: {
          sync_type: 'finapi_batch',
          updated_count: updatedCount,
          total_processed: filteredAssets.length,
          price_updates: priceUpdates
        },
        status: errors.length === 0 ? 'success' : 'partial_success'
      });
    }

    return Response.json({
      success: true,
      updated_count: updatedCount,
      total_processed: filteredAssets.length,
      price_updates: priceUpdates,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('finAPI sync error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});