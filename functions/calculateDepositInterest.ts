import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { deposit_id } = await req.json();
    const deposit = await base44.asServiceRole.entities.Deposit.read(deposit_id);

    const depositDate = new Date(deposit.deposit_date);
    const today = new Date();
    const years = (today - depositDate) / (1000 * 60 * 60 * 24 * 365);

    const interest = deposit.amount * deposit.interest_rate * years;

    await base44.asServiceRole.entities.Deposit.update(deposit_id, {
      accrued_interest: Math.round(interest * 100) / 100
    });

    return Response.json({ 
      success: true, 
      interest: Math.round(interest * 100) / 100,
      years: Math.round(years * 100) / 100
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});