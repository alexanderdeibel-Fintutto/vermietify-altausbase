import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { tenantId } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const tenant = await base44.entities.Tenant.filter({ id: tenantId });
        const leases = await base44.entities.LeaseContract.filter({ tenant_id: tenantId });
        const payments = await base44.entities.ActualPayment.list();
        const messages = await base44.entities.TenantMessage.filter({ tenant_id: tenantId });

        const tenantPayments = payments.filter(p => leases.some(l => l.unit_id === p.unit_id));
        const totalPaid = tenantPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalDue = leases.reduce((sum, l) => sum + l.monthly_rent * 12, 0);
        const paymentRate = ((totalPaid / totalDue * 100) || 0).toFixed(1);

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: `Erstelle einen Mieter-Performance-Bericht für: ${tenant[0]?.first_name} ${tenant[0]?.last_name}

Daten:
- Verträge: ${leases.length}
- Gezahlt: €${totalPaid.toFixed(2)}
- Fällig: €${totalDue.toFixed(2)}
- Zahlungsquote: ${paymentRate}%
- Nachrichten: ${messages.length}

{
  "tenant_info": {
    "name": "${tenant[0]?.first_name} ${tenant[0]?.last_name}",
    "lease_count": ${leases.length},
    "total_rent_paid": ${totalPaid}
  },
  "payment_performance": {
    "payment_rate": ${paymentRate},
    "on_time_percentage": 0,
    "average_delay_days": 0,
    "status": "EXCELLENT|GOOD|FAIR|POOR"
  },
  "communication_metrics": {
    "total_messages": ${messages.length},
    "response_time_avg": 0,
    "issue_resolution_rate": 0
  },
  "rating": {
    "overall": 0,
    "reliability": 0,
    "communication": 0,
    "maintenance_cooperation": 0
  },
  "insights": ["Einsicht"],
  "recommendations": ["Empfehlung"]
}`,
            response_json_schema: {
                type: 'object',
                properties: {
                    tenant_info: { type: 'object', additionalProperties: true },
                    payment_performance: { type: 'object', additionalProperties: true },
                    communication_metrics: { type: 'object', additionalProperties: true },
                    rating: { type: 'object', additionalProperties: true },
                    insights: { type: 'array', items: { type: 'string' } },
                    recommendations: { type: 'array', items: { type: 'string' } }
                }
            }
        });

        return new Response(JSON.stringify({
            success: true,
            report: response
        }), { status: 200 });

    } catch (error) {
        console.error('Tenant report error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});