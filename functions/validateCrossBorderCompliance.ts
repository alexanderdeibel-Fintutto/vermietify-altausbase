import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, primary_country } = await req.json();

    // Get all cross-border data
    const transactions = await base44.entities.CrossBorderTransaction.filter({
      user_email: user.email,
      tax_year
    });

    const crypto = await base44.entities.CryptoHolding.filter({
      user_email: user.email
    });

    const profile = (await base44.entities.TaxProfile.filter(
      { user_email: user.email },
      '-updated_date',
      1
    ))[0];

    // Validate compliance across all jurisdictions
    const validation = await base44.integrations.Core.InvokeLLM({
      prompt: `Validiere Cross-Border Tax Compliance für ${user.email}:

PRIMARY: ${primary_country}
JURISDICTIONS: ${profile?.tax_jurisdictions?.join(', ')}

CROSS-BORDER TRANSACTIONS:
${JSON.stringify(transactions.map(t => ({
  type: t.transaction_type,
  source: t.source_country,
  dest: t.destination_country,
  amount: t.amount
})), null, 2)}

CRYPTO HOLDINGS:
${JSON.stringify(crypto.map(c => ({
  asset: c.asset_name,
  exchange: c.country_of_exchange,
  reportable: c.is_reportable
})), null, 2)}

CHECK:
1. CRS/FATCA/AEoI Compliance (reportable thresholds)
2. Tax Treaty Benefits (correct application)
3. Transfer Pricing Documentation (if business)
4. Permanent Establishment Risk Assessment
5. Withholding Tax Compliance
6. Missing Documentation
7. Audit Risk Flags
8. Action Items with Deadlines

SEVERITY: info, warning, critical`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_compliance_status: { type: "string" },
          compliance_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                status: { type: "string" },
                severity: { type: "string" },
                action_required: { type: "string" },
                deadline: { type: "string" }
              }
            }
          },
          risk_score: { type: "number" },
          immediate_actions: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Save compliance record
    const compliance = await base44.entities.TaxCompliance.create({
      user_email: user.email,
      country: primary_country,
      tax_year,
      compliance_type: 'documentation',
      requirement: 'Cross-Border Compliance Validation',
      description: JSON.stringify(validation),
      status: validation.overall_compliance_status === 'compliant' ? 'completed' : 'in_progress',
      completion_percentage: 75,
      risk_flags: validation.immediate_actions
    });

    return Response.json({
      user_email: user.email,
      compliance_id: compliance.id,
      status: validation.overall_compliance_status,
      risk_score: validation.risk_score,
      immediate_actions: validation.immediate_actions
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});