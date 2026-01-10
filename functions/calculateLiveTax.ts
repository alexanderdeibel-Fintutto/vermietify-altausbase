import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { income } = await req.json();

  let income_tax = 0;
  
  if (income <= 11604) {
    income_tax = 0;
  } else if (income <= 66760) {
    income_tax = income * 0.24;
  } else {
    income_tax = income * 0.42;
  }

  const soli = income_tax * 0.055;
  const total_tax = income_tax + soli;
  const net_income = income - total_tax;

  return Response.json({
    income_tax: income_tax.toFixed(0),
    soli: soli.toFixed(0),
    total_tax: total_tax.toFixed(0),
    net_income: net_income.toFixed(0)
  });
});