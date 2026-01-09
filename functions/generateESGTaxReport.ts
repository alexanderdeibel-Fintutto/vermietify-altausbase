import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();

    // ESG/Sustainability Tax Reporting
    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere ESG/Nachhaltigkeit Tax Report für ${user.email} (${tax_year}):

ANALYSIERE:
1. Charitable Donations (qualified non-profits)
2. Green Energy Investments (tax credits)
3. Sustainable Asset Allocation
4. Carbon Footprint (emissions from portfolio)
5. ESG Fund Performance (tax implications)
6. Socially Responsible Investments
7. Impact Investing (preferential tax treatment)
8. Tax Credits for Green Activities

BERECHNE:
- Sustainability Tax Credits
- Donation Impact on Overall Tax
- ESG Investment Tax Efficiency
- Carbon Tax Implications
- Green Energy Credits

GEBE:
- ESG Metrics
- Tax Optimization Potential
- Reporting Standards Compliance`,
      response_json_schema: {
        type: "object",
        properties: {
          total_sustainable_investments: { type: "number" },
          total_charitable_donations: { type: "number" },
          estimated_esg_tax_credits: { type: "number" },
          carbon_footprint_estimate: { type: "number" },
          esg_portfolio_allocation: { type: "number" },
          impact_score: { type: "number" },
          tax_optimization_potential: { type: "number" },
          reporting_requirements: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      esg_report: report
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});