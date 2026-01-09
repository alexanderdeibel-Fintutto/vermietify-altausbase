import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, income_data } = await req.json();
    // income_data: { employment: 100000, freelance: 50000, investments: 25000, crypto_gains: 10000 }

    // Real-time Tax Estimate (live calculator)
    const estimate = await base44.integrations.Core.InvokeLLM({
      prompt: `Berechne Real-Time Steuerschätzung für ${user.email} in ${country}:

EINKOMMEN (YTD oder geschätzt):
${JSON.stringify(income_data, null, 2)}

BERECHNE:
1. Gross Income
2. Deductions (standard/estimated)
3. Taxable Income
4. Tax Calculation (progressiv nach Country)
5. Credits applicable
6. Net Tax
7. Estimated Q payments needed
8. Withholding adequacy

GEBE AUCH:
- Marginal Tax Rate
- Effective Tax Rate
- Refund/Payment Estimate
- If increased income by 10% what happens`,
      response_json_schema: {
        type: "object",
        properties: {
          gross_income: { type: "number" },
          estimated_deductions: { type: "number" },
          taxable_income: { type: "number" },
          estimated_tax: { type: "number" },
          marginal_rate: { type: "number" },
          effective_rate: { type: "number" },
          withholding_needed: { type: "number" },
          refund_or_payment: { type: "number" },
          quarterly_payment: { type: "number" }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      estimate,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});