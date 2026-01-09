import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, year_to_date_income, expected_annual_income } = await req.json();

    // KI-basierte Q-Payment Berechnung
    const qPayments = await base44.integrations.Core.InvokeLLM({
      prompt: `Berechne Quarterly Estimated Tax Payments für ${country}:

EINKOMMEN:
- YTD: $${year_to_date_income}
- Erwartet annual: $${expected_annual_income}

ANFORDERUNGEN nach ${country} Gesetz:
- Safe Harbor Regeln
- Penalty-Vermeidung
- Q1/Q2/Q3/Q4 Fristen
- Underpayment Interest Rates
- Installment Agreements

GEBE ZURÜCK:
- Q1-Q4 Payment amounts
- Payment dates (Fristen)
- Safe harbor percentage
- Penalty calculation falls underpaid
- Total annual tax liability
- Monthly breakdown`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          annual_tax_estimate: { type: "number" },
          quarterly_payments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quarter: { type: "string" },
                amount: { type: "number" },
                due_date: { type: "string" }
              }
            }
          },
          total_due: { type: "number" },
          safe_harbor_method: { type: "string" },
          underpayment_penalty: { type: "number" }
        }
      }
    });

    // Speichern für Tracking
    for (const payment of qPayments.quarterly_payments || []) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: user.email,
        type: 'tax_payment_reminder',
        title: `${payment.quarter}: ${payment.amount}`,
        description: `Estimated Tax Payment fällig`,
        scheduled_date: payment.due_date,
        status: 'pending'
      });
    }

    return Response.json({
      user_email: user.email,
      country,
      ...qPayments
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});