import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tax_year, jurisdictions } = await req.json();

    // Profil laden
    const profiles = await base44.entities.TaxProfile.filter({
      user_email: user.email
    }, '-updated_date', 1);

    if (!profiles.length) {
      return Response.json({ error: 'Steuerprofil nicht gefunden' }, { status: 404 });
    }

    const profile = profiles[0];
    const countries = jurisdictions || profile.tax_jurisdictions;

    // Pro Land Daten aggregieren
    const countryReports = {};

    for (const country of countries) {
      // Einkünfte pro Land
      const incomes = await base44.asServiceRole.entities.OtherIncome.filter({
        user_email: user.email,
        tax_year: tax_year
      });

      // Vermögen pro Land
      const assets = await base44.asServiceRole.entities.Investment.filter({
        user_email: user.email
      });

      // Grenzüberschreitende Transaktionen
      const crossBorder = await base44.asServiceRole.entities.CrossBorderTransaction.filter({
        user_email: user.email,
        tax_year: tax_year
      });

      const countryTransactions = crossBorder.filter(
        tx => tx.destination_country === country || tx.source_country === country
      );

      // Berechnung pro Land
      const totalIncome = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
      const totalAssets = assets.reduce((sum, ast) => sum + (ast.current_value || 0), 0);
      const crossBorderIncome = countryTransactions
        .filter(tx => tx.destination_country === country)
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      countryReports[country] = {
        country,
        tax_year,
        total_income: totalIncome,
        cross_border_income: crossBorderIncome,
        total_assets: totalAssets,
        estimated_tax: totalIncome * 0.25, // Vereinfachte Schätzung
        filing_deadline: getFilingDeadline(country, tax_year),
        required_forms: getRequiredForms(country, profile),
        withholding_requirements: checkWithholdingRequirements(country, profile)
      };
    }

    // KI-gestützte Multi-Country Optimierung
    const optimization = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein internationaler Steuerplaner. Analysiere folgende Multi-Country Steuersituation und identifiziere Optimierungspotenziale:

Länder: ${countries.join(', ')}
Steuerjahr: ${tax_year}
Profil: ${profile.profile_type}
Geschäftsanteile: ${profile.number_of_companies}
Immobilien: ${profile.number_of_properties}

Länderreports:
${JSON.stringify(countryReports, null, 2)}

Gib konkrete, grenzüberschreitende Optimierungsvorschläge mit Sparquoten an.`,
      response_json_schema: {
        type: "object",
        properties: {
          treaty_opportunities: {
            type: "array",
            items: { type: "string" }
          },
          structural_recommendations: {
            type: "array",
            items: { type: "string" }
          },
          estimated_total_savings: {
            type: "number"
          }
        }
      }
    });

    return Response.json({
      user_email: user.email,
      tax_year,
      countries: countries,
      country_reports: countryReports,
      optimization_recommendations: optimization,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getFilingDeadline(country, taxYear) {
  const deadlines = {
    'CH': `${taxYear + 1}-03-15`,
    'DE': `${taxYear + 1}-05-31`,
    'AT': `${taxYear + 1}-06-02`
  };
  return deadlines[country] || `${taxYear + 1}-12-31`;
}

function getRequiredForms(country, profile) {
  const forms = {
    'CH': ['Steuererklärung', 'Anlage Kapitalerträge', profile.number_of_companies > 0 ? 'Anlage Beteiligungen' : null],
    'DE': ['Anlage V', 'Anlage KAP', 'Anlage SO', profile.number_of_companies > 0 ? 'Anlage G' : null],
    'AT': ['Einkommensteuer', 'Anlage E', profile.number_of_companies > 0 ? 'Anlage G' : null]
  };
  return (forms[country] || []).filter(Boolean);
}

function checkWithholdingRequirements(country, profile) {
  if (!profile.cross_border_transactions) return null;
  
  return {
    country,
    crs_required: true,
    fatca_required: country !== 'AT' && country !== 'CH',
    treaty_reduction: true,
    documentation_required: true
  };
}