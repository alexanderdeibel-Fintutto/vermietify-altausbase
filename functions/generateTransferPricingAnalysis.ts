import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin only - Transfer Pricing complexity' }, { status: 403 });
    }

    const { tax_year, transaction_type, entities, amounts } = await req.json();
    // transaction_type: "service", "royalty", "loan", "goods"
    // entities: ["CH_Parent", "DE_Subsidiary", "AT_Affiliate"]

    // Transfer Pricing Analysis & Arm's Length Price
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere Transfer Pricing für inter-company Transaktion (${tax_year}):

TRANSAKTION:
- Typ: ${transaction_type}
- Betrag: $${amounts}
- Beteiligte: ${entities.join(' → ')}

ARM'S LENGTH PRINCIPLE:
- Comparable Uncontrolled Price (CUP)
- Resale Price Method (RPM)
- Cost Plus Method (CPM)
- Profit Split Method (PSM)
- Transactional Net Margin Method (TNMM)

ANALYSIERE:
1. Applicable Method pro OECD Guidance
2. Comparable Companies/Transactions
3. Safe Harbor Regulations
4. Transfer Pricing Documentation
5. Risk of Adjustment
6. Advance Pricing Agreement (APA)
7. BEPS Actions Impact
8. Mutual Agreement Procedures

RISK-ASSESSMENT:
- Low Risk: Market Rates
- Medium: Documentation Gaps
- High: Clear Misallocation`,
      response_json_schema: {
        type: "object",
        properties: {
          transaction_type: { type: "string" },
          recommended_method: { type: "string" },
          arms_length_price: { type: "number" },
          acceptable_range: { type: "object", properties: { min: { type: "number" }, max: { type: "number" } } },
          documentation_required: { type: "array", items: { type: "string" } },
          risk_level: { type: "string" },
          apa_recommendation: { type: "boolean" }
        }
      }
    });

    return Response.json({
      tax_year,
      transfer_pricing_analysis: analysis
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});