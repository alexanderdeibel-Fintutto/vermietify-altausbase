import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bank_account_id } = await req.json();
    const finapi_url = Deno.env.get('FINAPI_BASE_URL');
    const finapi_client_id = Deno.env.get('FINAPI_CLIENT_ID');
    const finapi_client_secret = Deno.env.get('FINAPI_CLIENT_SECRET');

    if (!finapi_client_id || !finapi_client_secret) {
      return Response.json({ error: 'FinAPI credentials not configured' }, { status: 500 });
    }

    // Get FinAPI token
    const tokenResponse = await fetch(`${finapi_url}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: finapi_client_id,
        client_secret: finapi_client_secret
      })
    });

    const tokenData = await tokenResponse.json();
    const access_token = tokenData.access_token;

    // Fetch transactions (simplified)
    const transResponse = await fetch(`${finapi_url}/api/v1/transactions`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const transactions = await transResponse.json();

    // Store automation rules for categorization
    const rules = await base44.entities.BankingAutomationRule.list();
    
    let processed = 0;
    let errors = 0;

    // In production: Process and categorize each transaction
    for (const trans of transactions.slice(0, 10)) {
      try {
        // Find matching rule
        const matchingRule = rules.find(rule => 
          trans.purpose.toLowerCase().includes(rule.pattern_match.toLowerCase())
        );

        if (matchingRule) {
          // Auto-categorize
          await base44.entities.BankingAutomationRule.update(matchingRule.id, {
            match_count: (matchingRule.match_count || 0) + 1
          });
          processed++;
        }
      } catch (e) {
        errors++;
      }
    }

    return Response.json({ 
      success: true,
      processed,
      errors,
      message: `${processed} Transaktionen verarbeitet`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});