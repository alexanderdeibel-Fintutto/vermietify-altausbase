import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();

    const profile = (await base44.entities.TaxProfile.filter({ user_email: user.email }, '-updated_date', 1))[0];
    const capitals = await base44.entities.CapitalGain.filter({ user_email: user.email, tax_year });
    const cryptos = await base44.entities.CryptoHolding.filter({ user_email: user.email });
    const investments = await base44.entities.Investment.filter({ user_email: user.email });

    // KI-Analyse für Tax Loss Harvesting
    const recommendations = await base44.integrations.Core.InvokeLLM({
      prompt: `Identifiziere Tax Loss Harvesting Möglichkeiten für ${profile.primary_residence_country} (${tax_year}):

POSITIONEN:
- Kapitalerträge: ${JSON.stringify(capitals.slice(0, 5))}
- Kryptowährungen: ${cryptos.length} Holdings
- Investitionen: ${investments.length} Positionen

LÄNDER-REGELN:
- ${profile.primary_residence_country} Gesetze
- Wash-Sale Regeln (falls vorhanden)
- Holding-Period Anforderungen
- Carryforward-Regeln

IDENTIFIZIERE:
1. Positionen mit unrealisierten Verlusten > $1000
2. Washsale-Risiken
3. Replacement-Positionen (ähnlich aber nicht identisch)
4. Timing-Strategie (wann realisiern, wann zurückkaufen)
5. Estimated Tax Savings
6. Dokumentations-Anforderungen

GEBE STRUKTURIERTE EMPFEHLUNGEN`,
      response_json_schema: {
        type: "object",
        properties: {
          total_harvestable_losses: { type: "number" },
          estimated_tax_savings: { type: "number" },
          opportunities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                asset: { type: "string" },
                current_loss: { type: "number" },
                harvest_date: { type: "string" },
                replacement_asset: { type: "string" },
                risk_level: { type: "string" }
              }
            }
          },
          washsale_risks: { type: "array", items: { type: "string" } },
          implementation_steps: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Speichern als TaxLossCarryforward
    await base44.asServiceRole.entities.TaxLossCarryforward.create({
      user_email: user.email,
      country: profile.primary_residence_country,
      loss_year: tax_year,
      loss_type: 'capital_loss',
      loss_amount: recommendations.total_harvestable_losses,
      loss_description: 'AI-identified tax loss harvesting opportunities',
      carryforward_period: 'unlimited',
      remaining_amount: recommendations.total_harvestable_losses,
      status: 'pending'
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      recommendations,
      status: 'analysis_complete'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});