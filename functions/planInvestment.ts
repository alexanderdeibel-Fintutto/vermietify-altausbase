import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { amount, duration } = await req.json();

  const interest_rate = 0.05;
  const future_value = amount * Math.pow(1 + interest_rate, duration);

  return Response.json({
    future_value: future_value.toFixed(0),
    total_return: (future_value - amount).toFixed(0),
    annual_return: ((future_value / amount - 1) / duration * 100).toFixed(1)
  });
});