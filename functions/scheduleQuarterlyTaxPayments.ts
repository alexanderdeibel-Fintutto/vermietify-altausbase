import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { country, annual_estimated_tax, setup_automation } = await req.json();

    // Quarterly Payment Scheduler
    const schedule = await base44.integrations.Core.InvokeLLM({
      prompt: `Erstelle Q1-Q4 Tax Payment Schedule für ${country}:

GESCHÄTZTE JAHRESSTEUERN: $${annual_estimated_tax}

LÄNDER-FRISTEN:
${country === 'CH' ? 'Kantonal variabel, meist jährlich oder halbjährlich' :
country === 'DE' ? 'Q1: 10.03, Q2: 10.06, Q3: 10.09, Q4: 10.12' :
'Quarterly, jeweils 15. des Folgemonats'}

BERECHNE:
- Q1-Q4 Payment Amounts
- Exact Due Dates
- Safe Harbor Methods
- Penalty Calculations
- Payment Methods (Bank Transfer, Online)
- Tracking & Documentation

GEBE AUTOMATISIERUNGS-VORSCHLAG:`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          quarterly_payments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quarter: { type: "string" },
                amount: { type: "number" },
                due_date: { type: "string" },
                payment_method: { type: "string" }
              }
            }
          },
          total_annual: { type: "number" },
          automation_possible: { type: "boolean" },
          automation_setup_steps: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Erstelle Zahlungs-Reminders
    if (setup_automation) {
      for (const payment of schedule.quarterly_payments || []) {
        await base44.asServiceRole.entities.TaxReminder.create({
          user_email: user.email,
          country,
          tax_year: new Date().getFullYear(),
          reminder_type: 'advance_payment',
          title: `${payment.quarter}: $${payment.amount} Tax Payment`,
          message: `Quarterly tax payment of $${payment.amount} due on ${payment.due_date}`,
          scheduled_date: new Date(new Date(payment.due_date).getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          related_deadline: payment.due_date,
          status: 'pending'
        });
      }
    }

    return Response.json({
      user_email: user.email,
      country,
      payment_schedule: schedule,
      automation_setup: setup_automation
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});