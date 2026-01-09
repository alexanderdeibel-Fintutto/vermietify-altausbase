import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxProfileData } = await req.json();

    // Analyse der Steuerkomplexität
    let complexityScore = 0;
    const riskFactors = [];
    const recommendedActions = [];

    // Jurisdiktionen
    const jurisdictionCount = taxProfileData.tax_jurisdictions?.length || 1;
    complexityScore += jurisdictionCount * 20;
    if (jurisdictionCount > 1) {
      riskFactors.push('Grenzüberschreitende Steuerlage - CRS/FATCA meldepflichtig');
      recommendedActions.push('Automatische Meldedatenerfassung aktivieren');
    }

    // Einkommensquellen
    const incomeSourcesCount = taxProfileData.income_sources?.length || 1;
    complexityScore += incomeSourcesCount * 15;
    if (incomeSourcesCount > 2) {
      riskFactors.push('Mehrere diverse Einkommensquellen');
      recommendedActions.push('Detaillierte Einkommensaufteilung pro Land durchführen');
    }

    // Vermögensklassen
    const assetCategoriesCount = taxProfileData.asset_categories?.length || 1;
    complexityScore += assetCategoriesCount * 12;
    
    if (taxProfileData.has_crypto_assets) {
      complexityScore += 25;
      riskFactors.push('Kryptowährungen - volatile Bewertung, spezielle Meldepflichten');
      recommendedActions.push('Krypto-Tracking-System aktivieren, automatische Kursabfrage');
    }

    if (taxProfileData.number_of_companies && taxProfileData.number_of_companies > 0) {
      complexityScore += taxProfileData.number_of_companies * 20;
      riskFactors.push(`${taxProfileData.number_of_companies} Unternehmensanteile - Beweisführung erforderlich`);
      recommendedActions.push('Organigramm und Beteiligungsstruktur dokumentieren');
    }

    if (taxProfileData.number_of_properties && taxProfileData.number_of_properties > 1) {
      complexityScore += taxProfileData.number_of_properties * 15;
      riskFactors.push('Mehrere Immobilien - separate Bilanzierung erforderlich');
      recommendedActions.push('Immobilienportfolio-Übersicht mit Bewertungen erstellen');
    }

    if (taxProfileData.cross_border_transactions) {
      complexityScore += 30;
      riskFactors.push('Grenzüberschreitende Transaktionen - Dokumentation kritisch');
      recommendedActions.push('Automatische grenzüberschreitende Transaktionsverfolgung');
    }

    // FinAPI-Verbindung
    let dataCompleteness = taxProfileData.finapi_connected ? 80 : 30;
    if (!taxProfileData.finapi_connected) {
      recommendedActions.push('FinAPI verbinden für automatische Bankdaten-Synchronisation');
    }

    // Profil-Typ ermitteln
    let profileType = 'simple';
    if (complexityScore > 70) profileType = 'enterprise';
    else if (complexityScore > 40) profileType = 'complex';
    else if (complexityScore > 20) profileType = 'intermediate';

    // KI-Empfehlungen
    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein internationaler Steuerfachmann. Analysiere folgende Steuersituation und gib konkrete Optimierungsvorschläge:

Profil-Typ: ${profileType}
Komplexitätsscore: ${complexityScore}
Steuerjurisdiktionen: ${taxProfileData.tax_jurisdictions.join(', ')}
Vermögensklassen: ${taxProfileData.asset_categories?.join(', ') || 'Standard'}
Grenzüberschreitend: ${taxProfileData.cross_border_transactions ? 'Ja' : 'Nein'}
Kryptowährungen: ${taxProfileData.has_crypto_assets ? 'Ja' : 'Nein'}
Firmenanteile: ${taxProfileData.number_of_companies || 0}
Immobilien: ${taxProfileData.number_of_properties || 0}

Gib 3-5 konkrete, prioritäre Handlungsempfehlungen zur Steueroptimierung und zur Risikominderung. Berücksichtige internationale Abkommens (Steuertreaties zwischen AT/CH/DE).`,
      response_json_schema: {
        type: "object",
        properties: {
          key_risks: {
            type: "array",
            items: { type: "string" }
          },
          optimization_opportunities: {
            type: "array",
            items: { type: "string" }
          },
          compliance_priorities: {
            type: "array",
            items: { type: "string" }
          },
          estimated_tax_savings_percent: {
            type: "number"
          }
        }
      }
    });

    return Response.json({
      complexity_score: complexityScore,
      profile_type: profileType,
      data_completeness_percent: dataCompleteness,
      risk_factors: riskFactors,
      recommended_actions: recommendedActions,
      ai_recommendations: aiAnalysis
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});