import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, taxYear, accountId } = await req.json();

    if (!accountId || !country || !taxYear) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch transactions from FinAPI
    const finapiBaseUrl = Deno.env.get('FINAPI_BASE_URL');
    const finapiClientId = Deno.env.get('FINAPI_CLIENT_ID');
    const finapiClientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');

    // Get access token
    const tokenResponse = await fetch(`${finapiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: finapiClientId,
        client_secret: finapiClientSecret
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch transactions for tax year
    const startDate = `${taxYear}-01-01`;
    const endDate = `${taxYear}-12-31`;

    const txResponse = await fetch(
      `${finapiBaseUrl}/api/v1/transactions?accountId=${accountId}&minBookingDate=${startDate}&maxBookingDate=${endDate}&page=0&perPage=500`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const txData = await txResponse.json();
    const transactions = txData.transactions || [];

    // Categorize and aggregate by tax categories
    const categorized = {
      income: 0,
      business_expenses: 0,
      investment_income: 0,
      capital_gains: 0,
      other: 0,
      categories: {}
    };

    for (const tx of transactions) {
      const amount = tx.amount || 0;
      const purpose = (tx.purpose || '').toLowerCase();

      // Simple categorization
      if (amount > 0) {
        if (purpose.includes('gehalt') || purpose.includes('lohn') || purpose.includes('einkommen')) {
          categorized.income += amount;
        } else if (purpose.includes('dividend') || purpose.includes('zins')) {
          categorized.investment_income += amount;
        } else {
          categorized.other += amount;
        }
      } else {
        if (purpose.includes('büro') || purpose.includes('kosten') || purpose.includes('ausgabe')) {
          categorized.business_expenses += Math.abs(amount);
        } else {
          categorized.other += Math.abs(amount);
        }
      }

      // Store category breakdown
      const category = tx.category || 'UNCATEGORIZED';
      if (!categorized.categories[category]) {
        categorized.categories[category] = 0;
      }
      categorized.categories[category] += Math.abs(amount);
    }

    return Response.json({
      status: 'success',
      integration: {
        country,
        tax_year: taxYear,
        account_id: accountId,
        transaction_count: transactions.length,
        categorized_summary: categorized,
        raw_transactions: transactions.slice(0, 10) // First 10 for preview
      }
    });
  } catch (error) {
    console.error('FinAPI integration error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});