import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get('FINAPI_BASE_URL');
const FINAPI_CLIENT_ID = Deno.env.get('FINAPI_CLIENT_ID');
const FINAPI_CLIENT_SECRET = Deno.env.get('FINAPI_CLIENT_SECRET');

async function getFinAPIToken() {
  const response = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${FINAPI_CLIENT_ID}:${FINAPI_CLIENT_SECRET}`)}`
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('FinAPI Token-Anfrage fehlgeschlagen');
  }

  const data = await response.json();
  return data.access_token;
}

async function getSecurities(token, accountId) {
  const response = await fetch(`${FINAPI_BASE_URL}/api/v1/securities?accountIds=${accountId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('FinAPI Securities-Anfrage fehlgeschlagen');
  }

  return await response.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { portfolioAccountId, finapiAccountId } = body;

    if (!portfolioAccountId || !finapiAccountId) {
      return Response.json(
        { error: 'portfolioAccountId und finapiAccountId erforderlich' },
        { status: 400 }
      );
    }

    // FinAPI Token holen
    const token = await getFinAPIToken();

    // Wertpapiere von FinAPI laden
    const securities = await getSecurities(token, finapiAccountId);

    const results = {
      synced: 0,
      created: 0,
      errors: []
    };

    // Assets und Holdings synchronisieren
    for (const security of securities.securities || []) {
      try {
        const isin = security.isin;
        const symbol = security.wkn || security.isin;
        const name = security.name;
        const quantity = security.quantity || 0;
        const value = security.value || 0;
        const price = quantity > 0 ? value / quantity : 0;

        // Asset suchen oder erstellen
        let assets = await base44.entities.Asset.filter({ isin });
        let asset = assets.length > 0 ? assets[0] : null;

        if (!asset) {
          asset = await base44.entities.Asset.create({
            isin,
            symbol,
            name,
            asset_class: 'stock',
            currency: 'EUR',
            tax_category: 'standard',
            is_actively_traded: true
          });
          results.created++;
        }

        // Transaktion erstellen (Bestandsabgleich)
        await base44.entities.AssetTransaction.create({
          portfolio_account_id: portfolioAccountId,
          asset_id: asset.id,
          transaction_type: 'buy',
          transaction_date: new Date().toISOString().split('T')[0],
          quantity,
          price_per_unit: price,
          price_currency: 'EUR',
          exchange_rate: 1,
          gross_amount: value,
          fees: 0,
          taxes_withheld: 0,
          net_amount: value
        });

        // Holdings neu berechnen
        await base44.functions.invoke('recalculateHoldings', {
          portfolioAccountId,
          assetId: asset.id
        });

        results.synced++;
      } catch (error) {
        console.error(`Error syncing ${security.isin}:`, error);
        results.errors.push({ isin: security.isin, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `${results.synced} Positionen synchronisiert, ${results.created} neue Assets`,
      results
    });
  } catch (error) {
    console.error('FinAPI sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});