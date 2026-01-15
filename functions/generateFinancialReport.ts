import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { buildingId, startDate, endDate } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const invoices = await base44.entities.Invoice.list();
        const payments = await base44.entities.ActualPayment.list();
        const units = await base44.entities.Unit.filter({ building_id: buildingId });

        const relevantInvoices = invoices.filter(i => units.some(u => u.id === i.unit_id));
        const relevantPayments = payments.filter(p => units.some(u => u.id === p.unit_id));

        const totalIncome = relevantPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalExpenses = relevantInvoices.reduce((sum, i) => sum + i.amount, 0);
        const profit = totalIncome - totalExpenses;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Erstelle einen professionellen Finanzbericht:

Zeitraum: ${startDate} bis ${endDate}
Gesamteinnahmen: €${totalIncome.toFixed(2)}
Gesamtausgaben: €${totalExpenses.toFixed(2)}
Gewinn: €${profit.toFixed(2)}

{
  "period": "${startDate} - ${endDate}",
  "income_summary": {
    "total": ${totalIncome},
    "by_category": [
      {"category": "Kategorie", "amount": 0}
    ]
  },
  "expense_summary": {
    "total": ${totalExpenses},
    "by_category": [
      {"category": "Kategorie", "amount": 0}
    ]
  },
  "profitability": {
    "gross_profit": ${profit},
    "profit_margin": 0,
    "roi": 0
  },
  "cash_flow_analysis": "Text",
  "insights": ["Einsicht 1"],
  "tax_deductible": ${totalExpenses * 0.8}
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    period: { type: 'string' },
                    income_summary: { type: 'object', additionalProperties: true },
                    expense_summary: { type: 'object', additionalProperties: true },
                    profitability: { type: 'object', additionalProperties: true },
                    cash_flow_analysis: { type: 'string' },
                    insights: { type: 'array', items: { type: 'string' } },
                    tax_deductible: { type: 'number' }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            report: response
        }), { status: 200 });

    } catch (error) {
        console.error('Financial report error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});