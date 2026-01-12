import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hole alle aktiven Assets
    const assets = await base44.entities.Asset.filter({ is_actively_traded: true });
    console.log(`Synchronisiere ${assets.length} Assets...`);

    const results = {
      updated: 0,
      failed: 0,
      errors: []
    };

    // Gruppiere Assets nach Klasse
    const assetsByClass = {};
    assets.forEach(asset => {
      if (!assetsByClass[asset.asset_class]) {
        assetsByClass[asset.asset_class] = [];
      }
      assetsByClass[asset.asset_class].push(asset);
    });

    // TODO: Implementiere API-Calls pro Asset-Klasse
    // - Alpha Vantage für Aktien/ETFs
    // - CoinGecko für Kryptowährungen
    // - Metals-API für Edelmetalle
    // - Yahoo Finance als Fallback

    // TODO: Speichere Kurse in AssetPrice
    // TODO: Aktualisiere AssetHolding mit current_price und berechneten G/V

    return Response.json({
      success: true,
      message: `Synchronisierung abgeschlossen: ${results.updated} aktualisiert, ${results.failed} fehler`,
      results
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});