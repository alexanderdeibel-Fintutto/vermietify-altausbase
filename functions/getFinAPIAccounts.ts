import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await base44.entities.BankAccount.list(null, 50);

  return Response.json({ 
    accounts: accounts.map(a => ({
      id: a.id,
      name: a.name,
      iban: a.iban,
      balance: a.balance || 0
    }))
  });
});