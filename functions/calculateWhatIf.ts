import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { property_purchase, additional_income, investment_amount } = await req.json();

  const currentTax = 25000;
  const currentWealth = 500000;

  // Simple tax calculation
  const additionalTaxOnIncome = additional_income * 0.42;
  const propertyAfaDeduction = property_purchase * 0.02 * 0.42;
  
  const taxImpact = additionalTaxOnIncome - propertyAfaDeduction;
  const netWealth = currentWealth + property_purchase + investment_amount - taxImpact;

  return Response.json({
    tax_impact: taxImpact.toFixed(0),
    net_wealth: netWealth.toFixed(0)
  });
});