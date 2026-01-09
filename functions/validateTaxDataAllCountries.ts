import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year } = await req.json();

    const profile = (await base44.entities.TaxProfile.filter({
      user_email: user.email
    }, '-updated_date', 1))[0];

    if (!profile) {
      return Response.json({ error: 'Profil nicht gefunden' }, { status: 404 });
    }

    const validationResults = {};

    // Pro Land validieren
    for (const country of profile.tax_jurisdictions) {
      const rules = getValidationRules(country);
      const issues = [];
      const warnings = [];

      // Grundlegende Validierung
      if (!profile.number_of_companies && profile.has_crypto_assets) {
        warnings.push(`${country}: Kryptowährungen ohne Geschäftsbetrieb - Beweisführung prüfen`);
      }

      if (profile.cross_border_transactions && !profile.finapi_connected) {
        issues.push(`${country}: Grenzüberschreitende Transaktionen erfordern detaillierte Dokumentation`);
      }

      // KI-basierte tiefe Validierung
      const validation = await base44.integrations.Core.InvokeLLM({
        prompt: `Validiere folgende Steuerdaten für ${country} (${tax_year}):

Land-spezifische Regeln:
${JSON.stringify(rules, null, 2)}

Profil:
- Profil-Typ: ${profile.profile_type}
- Jurisdiktionen: ${profile.tax_jurisdictions.join(', ')}
- Grenzüberschreitend: ${profile.cross_border_transactions}
- Kryptowährungen: ${profile.has_crypto_assets}
- Firmenanteile: ${profile.number_of_companies}

Prüfe auf:
- Meldefristen
- Reporting-Anforderungen
- Fehlende Dokumente
- Risiken
- Anomalien`,
        response_json_schema: {
          type: "object",
          properties: {
            is_valid: { type: "boolean" },
            critical_issues: { type: "array", items: { type: "string" } },
            warnings: { type: "array", items: { type: "string" } },
            compliance_score: { type: "number" },
            next_steps: { type: "array", items: { type: "string" } }
          }
        }
      });

      validationResults[country] = {
        country,
        ...validation,
        additional_warnings: warnings
      };
    }

    return Response.json({
      user_email: user.email,
      tax_year,
      validation_results: validationResults,
      overall_status: Object.values(validationResults).every(v => v.is_valid) ? 'compliant' : 'issues_found',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getValidationRules(country) {
  const rules = {
    'CH': {
      capital_gains_taxable: true,
      crypto_taxable: true,
      reporting_threshold_usd: 600000,
      withholding_tax: '35%',
      treaty_countries: ['DE', 'AT']
    },
    'DE': {
      capital_gains_taxable: true,
      crypto_taxable: true,
      reporting_threshold_usd: 1000000,
      withholding_tax: '26.375%',
      treaty_countries: ['CH', 'AT'],
      quarterly_payments: true
    },
    'AT': {
      capital_gains_taxable: true,
      crypto_taxable: true,
      reporting_threshold_usd: 500000,
      withholding_tax: '27.5%',
      treaty_countries: ['DE', 'CH']
    }
  };
  return rules[country] || {};
}