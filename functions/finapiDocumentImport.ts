import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, account_id } = await req.json();
    const clientId = Deno.env.get('FINAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('FINAPI_CLIENT_SECRET');
    const finApiUrl = Deno.env.get('FINAPI_BASE_URL');

    // Get access token
    const tokenRes = await fetch(`${finApiUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const { access_token } = await tokenRes.json();

    // Get transactions
    const txRes = await fetch(`${finApiUrl}/api/v1/accounts/${account_id}/transactions`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const transactions = await txRes.json();

    const importedDocs = [];

    for (const tx of transactions) {
      const doc = await base44.asServiceRole.entities.Document.create({
        company_id,
        name: `Transaction: ${tx.purpose || tx.counterpartyName}`,
        document_type: 'financial_statement',
        content: JSON.stringify(tx),
        tags: ['finapi', 'transaction', `${new Date(tx.bookingDate).getFullYear()}`],
        metadata: {
          finapi_id: tx.id,
          amount: tx.amount,
          date: tx.bookingDate
        }
      });

      importedDocs.push(doc);
    }

    return Response.json({ success: true, count: importedDocs.length });
  } catch (error) {
    console.error('FinAPI import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});