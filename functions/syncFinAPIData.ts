import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { finapi_user_id } = await req.json();

    // FinAPI Integration
    const clientId = Deno.env.get('FINAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');
    const baseUrl = Deno.env.get('FINAPI_BASE_URL');

    if (!clientId || !clientSecret || !baseUrl) {
      return Response.json({ 
        error: 'FinAPI nicht konfiguriert' 
      }, { status: 500 });
    }

    // Step 1: Get FinAPI Access Token
    const tokenRes = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenRes.ok) {
      throw new Error('FinAPI Token-Fehler');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Step 2: Konten abrufen
    const accountsRes = await fetch(`${baseUrl}/api/v1/accounts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!accountsRes.ok) {
      throw new Error('Konten abrufen fehlgeschlagen');
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts || [];

    // Step 3: Transaktionen pro Konto abrufen (letzte 90 Tage)
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    const dateFrom = ninetyDaysAgo.toISOString().split('T')[0];

    let allTransactions = [];
    for (const account of accounts) {
      const txRes = await fetch(`${baseUrl}/api/v1/transactions`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          accountIds: [account.id],
          dateFrom: dateFrom
        }),
        method: 'POST'
      });

      if (txRes.ok) {
        const txData = await txRes.json();
        allTransactions = allTransactions.concat(txData.transactions || []);
      }
    }

    // Step 4: Wertpapiere/Investitionen abrufen
    const securitiesRes = await fetch(`${baseUrl}/api/v1/securities`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let securities = [];
    if (securitiesRes.ok) {
      const secData = await securitiesRes.json();
      securities = secData.securities || [];
    }

    // Step 5: Daten speichern/aktualisieren
    const syncResult = {
      accounts_synced: accounts.length,
      transactions_synced: allTransactions.length,
      securities_synced: securities.length,
      last_sync: new Date().toISOString(),
      user_email: user.email,
      status: 'success'
    };

    // TaxProfile aktualisieren
    const profiles = await base44.entities.TaxProfile.filter({
      user_email: user.email
    }, '-updated_date', 1);

    if (profiles.length > 0) {
      await base44.entities.TaxProfile.update(profiles[0].id, {
        finapi_connected: true,
        last_assessment: new Date().toISOString()
      });
    }

    // Automatische Datenklassifizierung
    const classified = await classifyFinancialData(allTransactions, securities);

    return Response.json({
      ...syncResult,
      classified_data: classified
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      status: 'failed'
    }, { status: 500 });
  }
});

async function classifyFinancialData(transactions, securities) {
  const classification = {
    income: [],
    expenses: [],
    investments: [],
    transfers: [],
    crypto_related: [],
    cross_border: []
  };

  // Einfache Klassifizierung
  for (const tx of transactions) {
    if (tx.amount > 0) {
      classification.income.push(tx);
    } else {
      classification.expenses.push(tx);
    }

    // Erkennung grenzüberschreitender Transaktionen
    if (tx.counterpartCountry && tx.counterpartCountry !== tx.country) {
      classification.cross_border.push(tx);
    }

    // Krypto-Erkennung
    if (tx.purpose?.toLowerCase().includes('crypto') || 
        tx.purpose?.toLowerCase().includes('bitcoin') ||
        tx.counterpartName?.toLowerCase().includes('kraken') ||
        tx.counterpartName?.toLowerCase().includes('bitstamp')) {
      classification.crypto_related.push(tx);
    }
  }

  return classification;
}