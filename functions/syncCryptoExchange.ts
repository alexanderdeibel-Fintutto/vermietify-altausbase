import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { api_key } = await req.json();

  // Mock crypto data
  const mockHoldings = [
    { symbol: 'BTC', amount: 0.5, value_eur: 18500 },
    { symbol: 'ETH', amount: 2.3, value_eur: 4600 }
  ];

  for (const holding of mockHoldings) {
    await base44.entities.CryptoHolding.create(holding);
  }

  return Response.json({ success: true });
});