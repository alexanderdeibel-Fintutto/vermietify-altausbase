import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const FINAPI_BASE_URL = Deno.env.get('FINAPI_BASE_URL');
  const CLIENT_ID = Deno.env.get('FINAPI_CLIENT_ID');
  const CLIENT_SECRET = Deno.env.get('FINAPI_CLIENT_SECRET');

  // Get FinAPI access token
  const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });

  const { access_token } = await tokenResponse.json();

  // Fetch transactions
  const transactionsResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/transactions`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });

  const { transactions } = await transactionsResponse.json();

  // Import to FinancialItems
  for (const tx of transactions.slice(0, 50)) {
    await base44.asServiceRole.entities.FinancialItem.create({
      name: tx.purpose,
      amount: tx.amount,
      category: 'Import',
      created_date: tx.bookingDate
    });
  }

  return Response.json({ success: true, imported: transactions.length });
});