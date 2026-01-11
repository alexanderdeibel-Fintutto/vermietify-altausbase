import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { financing_id } = await req.json();
    const loan = await base44.asServiceRole.entities.Financing.read(financing_id);

    const principal = loan.loan_amount || 0;
    const annualRate = (loan.interest_rate || 0) / 100;
    const monthlyRate = annualRate / 12;
    const months = loan.duration_years * 12;

    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                          (Math.pow(1 + monthlyRate, months) - 1);

    let balance = principal;
    const schedule = [];

    for (let i = 1; i <= Math.min(months, 12); i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month: i,
        payment: Math.round(monthlyPayment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(balance * 100) / 100
      });
    }

    const totalInterest = (monthlyPayment * months) - principal;

    return Response.json({ 
      success: true,
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      total_cost: Math.round((monthlyPayment * months) * 100) / 100,
      schedule: schedule
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});