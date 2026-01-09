import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, country } = await req.json();

    // Lade alle Crypto Holdings
    const holdings = await base44.entities.CryptoHolding.filter({
      user_email: user.email
    });

    // Generate comprehensive Crypto Tax Report
    const report = await base44.integrations.Core.InvokeLLM({
      prompt: `Generiere umfassenden Crypto Tax Report für ${user.email} in ${country} (${tax_year}):

CRYPTO HOLDINGS:
${JSON.stringify(holdings.map(h => ({
  asset: h.asset_name,
  quantity: h.quantity,
  acquired: h.acquisition_date,
  cost_basis: h.acquisition_price_usd,
  current_value: h.current_price_usd * h.quantity,
  exchange: h.exchange,
  country_of_exchange: h.country_of_exchange
})), null, 2)}

LAND-SPEZIFISCHE RULES:
${country === 'DE' ? 'Einkünfte aus Kapitalvermögen, Spekulation (< 1 Jahr), Einkünfte aus Privat-Veräußerung, Haltefristen' :
country === 'CH' ? 'Kapitalgewinne steuerfrei (privat), berufliche Trader andere Behandlung' :
'Ordinary Income wenn < 1 Jahr, Long-term Capital Gains wenn > 1 Jahr, Mining Income, Staking, DeFi'}

BERECHNE:
1. Total Acquisitions (Cost Basis)
2. Total Current Value
3. Realized Gains/Losses (Dispositions)
4. Unrealized Gains/Losses
5. Taxable Events (Forks, Airdrops, Staking)
6. Wash Sale Implications
7. Reportable Thresholds (>25k USD, etc.)
8. Form Requirements

GEBE:
- Tax Summary
- Form Recommendations
- Missing Data Identification
- Compliance Checklist`,
      response_json_schema: {
        type: "object",
        properties: {
          country: { type: "string" },
          total_acquisitions: { type: "number" },
          total_current_value: { type: "number" },
          unrealized_gains: { type: "number" },
          realized_gains_ytd: { type: "number" },
          taxable_income: { type: "number" },
          estimated_tax: { type: "number" },
          is_reportable: { type: "boolean" },
          forms_required: { type: "array", items: { type: "string" } },
          missing_data: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Speichern als TaxDocument
    await base44.entities.TaxDocument.create({
      user_email: user.email,
      country,
      tax_year,
      document_type: 'trading_log',
      file_name: `crypto_tax_report_${tax_year}`,
      file_url: 'generated',
      title: `Crypto Tax Report ${tax_year}`,
      description: 'Auto-generated from portfolio data',
      extracted_data: report,
      status: 'processed',
      tags: ['crypto', 'generated', tax_year.toString()]
    });

    return Response.json({
      user_email: user.email,
      country,
      tax_year,
      crypto_report: report
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});