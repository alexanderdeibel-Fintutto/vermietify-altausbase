import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[SEED] Creating comprehensive tax category master data');

    const masterCategories = [
      // === PRIVATPERSON / ANLAGE V ===
      { category_code: "PRIV_GRUNDSTEUER", display_name: "Grundsteuer", legal_forms: ["PRIVATPERSON"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { ANLAGE_V: "Zeile 33" }, skr03_account: "73100", skr04_account: "4530", keywords: ["grundsteuer", "grundbesitzabgaben"], examples: ["Grundsteuerbescheid", "Grundbesitzabgaben"] },
      { category_code: "PRIV_ABSCHREIBUNG_GEBAEUDE", display_name: "AfA Gebäude", legal_forms: ["PRIVATPERSON"], tax_treatment: "AFA", allocatable: false, tax_form_lines: { ANLAGE_V: "Zeile 34" }, skr03_account: "74800", skr04_account: "4855", keywords: ["abschreibung", "afa"], examples: ["Gebäude-AfA 2%"] },
      { category_code: "PRIV_SCHULDZINSEN", display_name: "Schuldzinsen", legal_forms: ["PRIVATPERSON"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: { ANLAGE_V: "Zeile 35" }, skr03_account: "73200", skr04_account: "4610", keywords: ["zinsen", "darlehen", "hypothek"], examples: ["Baufinanzierung", "Hypothekenzinsen"] },
      { category_code: "PRIV_HAUSGELD", display_name: "Hausgeld (WEG)", legal_forms: ["PRIVATPERSON"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { ANLAGE_V: "Zeile 46" }, skr03_account: "73400", skr04_account: "4250", keywords: ["hausgeld", "weg", "wohnungseigentum"], examples: ["Monatliches Hausgeld", "WEG-Vorauszahlung"] },
      { category_code: "PRIV_VERSICHERUNGEN", display_name: "Versicherungen", legal_forms: ["PRIVATPERSON"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { ANLAGE_V: "Zeile 37" }, skr03_account: "73300", skr04_account: "4360", keywords: ["versicherung", "gebäudeversicherung"], examples: ["Wohngebäudeversicherung", "Haftpflichtversicherung"] },
      { category_code: "PRIV_INSTANDHALTUNG", display_name: "Instandhaltung & Reparatur", legal_forms: ["PRIVATPERSON"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { ANLAGE_V: "Zeile 38" }, skr03_account: "73500", skr04_account: "4200", keywords: ["reparatur", "instandhaltung", "wartung"], examples: ["Heizungswartung", "Dachreparatur"] },
      { category_code: "PRIV_HAUSVERWALTUNG", display_name: "Hausverwaltung", legal_forms: ["PRIVATPERSON"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { ANLAGE_V: "Zeile 44" }, skr03_account: "73600", skr04_account: "4960", keywords: ["verwaltung", "hausverwaltung"], examples: ["Verwaltungsgebühr", "WEG-Verwaltung"] },
      { category_code: "PRIV_BETRIEBSKOSTEN", display_name: "Sonstige Betriebskosten", legal_forms: ["PRIVATPERSON"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { ANLAGE_V: "Zeile 46" }, skr03_account: "73700", skr04_account: "4240", keywords: ["betriebskosten", "nebenkosten"], examples: ["Müllabfuhr", "Straßenreinigung"] },
      
      // === GBR ===
      { category_code: "GBR_GRUNDSTEUER", display_name: "Grundsteuer (GbR)", legal_forms: ["GBR"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { EST1B: "Zeile 28", GEWERBESTEUER: "Zeile 14" }, skr03_account: "73100", skr04_account: "4530", keywords: ["grundsteuer"], examples: ["Grundsteuerbescheid GbR"] },
      { category_code: "GBR_KREDITZINSEN", display_name: "Kreditzinsen (GbR)", legal_forms: ["GBR"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: { EST1B: "Zeile 37", GEWERBESTEUER: "Hinzurechnung §8 Nr.1" }, skr03_account: "73200", skr04_account: "4610", keywords: ["zinsen", "darlehen"], examples: ["Gesellschafterdarlehen-Zinsen"] },
      { category_code: "GBR_SONDERBETRIEBSAUSGABEN", display_name: "Sonderbetriebsausgaben", legal_forms: ["GBR"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: { EST1B: "Ergänzende Angaben" }, skr03_account: "78900", skr04_account: "4980", keywords: ["sonderbetriebsausgaben"], examples: ["Gesellschafter-Aufwendungen"] },
      { category_code: "GBR_ABSCHREIBUNG_GEBAEUDE", display_name: "AfA Gebäude (GbR)", legal_forms: ["GBR"], tax_treatment: "AFA", allocatable: false, tax_form_lines: { EST1B: "Zeile 34" }, skr03_account: "74800", skr04_account: "4855", keywords: ["afa", "abschreibung"], examples: ["Gebäude-AfA GbR"] },
      { category_code: "GBR_STEUERBERATUNGSKOSTEN", display_name: "Steuerberatungskosten", legal_forms: ["GBR"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: { EST1B: "Zeile 45" }, skr03_account: "73800", skr04_account: "4970", keywords: ["steuerberater", "beratung"], examples: ["Jahresabschluss Steuerberater"] },
      
      // === GMBH/UG ===
      { category_code: "GMBH_GRUNDSTEUER", display_name: "Grundsteuer (GmbH)", legal_forms: ["GMBH", "UG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { GEWERBESTEUER: "Zeile 14" }, skr03_account: "73100", skr04_account: "4530", keywords: ["grundsteuer"], examples: ["Grundsteuer GmbH-Immobilie"] },
      { category_code: "GMBH_ZINSEN", display_name: "Zinsen (GmbH)", legal_forms: ["GMBH", "UG"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: { GEWERBESTEUER: "Hinzurechnung §8 Nr.1" }, skr03_account: "73200", skr04_account: "4610", keywords: ["zinsen", "fremdkapital"], examples: ["Bankdarlehen-Zinsen"] },
      { category_code: "GMBH_ABSCHREIBUNG_GEBAEUDE", display_name: "AfA Gebäude (GmbH)", legal_forms: ["GMBH", "UG"], tax_treatment: "AFA", allocatable: false, tax_form_lines: { GEWERBESTEUER: "Gewinn vor Hinzurechnungen" }, skr03_account: "74800", skr04_account: "4855", keywords: ["afa"], examples: ["Gebäude-AfA GmbH"] },
      { category_code: "GMBH_GESCHAEFTSFUEHRUNG", display_name: "Geschäftsführervergütung", legal_forms: ["GMBH", "UG"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: {}, skr03_account: "78100", skr04_account: "4120", keywords: ["gehalt", "geschäftsführer"], examples: ["GF-Gehalt"] },
      { category_code: "GMBH_RECHTS_BERATUNG", display_name: "Rechts- & Beratungskosten", legal_forms: ["GMBH", "UG"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: {}, skr03_account: "73800", skr04_account: "4970", keywords: ["anwalt", "berater"], examples: ["Anwaltskosten", "Wirtschaftsprüfer"] },
      
      // === AG ===
      { category_code: "AG_GRUNDSTEUER", display_name: "Grundsteuer (AG)", legal_forms: ["AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: { GEWERBESTEUER: "Zeile 14" }, skr03_account: "73100", skr04_account: "4530", keywords: ["grundsteuer"], examples: ["Grundsteuer AG-Immobilien"] },
      { category_code: "AG_AUFSICHTSRAT", display_name: "Aufsichtsratsvergütung", legal_forms: ["AG"], tax_treatment: "SOFORT", allocatable: false, tax_form_lines: {}, skr03_account: "78200", skr04_account: "4130", keywords: ["aufsichtsrat"], examples: ["Aufsichtsrats-Tantieme"] },
      { category_code: "AG_KAPITALERHOEHUNG", display_name: "Kapitalerhöhungskosten", legal_forms: ["AG"], tax_treatment: "NICHT_ABSETZBAR", allocatable: false, tax_form_lines: {}, skr03_account: "00000", skr04_account: "0000", keywords: ["kapitalerhöhung", "emission"], examples: ["Emissionskosten Aktien"] },
      
      // === GEMEINSAME KATEGORIEN (ALLE RECHTSFORMEN) ===
      { category_code: "ALL_WASSER", display_name: "Wasser/Abwasser", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73410", skr04_account: "4260", keywords: ["wasser", "abwasser"], examples: ["Wasserrechnung"] },
      { category_code: "ALL_HEIZUNG", display_name: "Heizkosten", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73420", skr04_account: "4270", keywords: ["heizung", "heizöl", "gas"], examples: ["Gasrechnung", "Heizöllieferung"] },
      { category_code: "ALL_STROM", display_name: "Strom", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73430", skr04_account: "4280", keywords: ["strom", "elektrizität"], examples: ["Stromrechnung"] },
      { category_code: "ALL_MUELL", display_name: "Müllabfuhr", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73440", skr04_account: "4290", keywords: ["müll", "abfall"], examples: ["Müllgebühren"] },
      { category_code: "ALL_REINIGUNG", display_name: "Reinigungskosten", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73450", skr04_account: "4220", keywords: ["reinigung", "treppenhausreinigung"], examples: ["Treppenhausreinigung"] },
      { category_code: "ALL_GARTENPFLEGE", display_name: "Gartenpflege", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73460", skr04_account: "4230", keywords: ["garten", "grünpflege"], examples: ["Rasenmähen", "Heckenschnitt"] },
      { category_code: "ALL_WINTERDIENST", display_name: "Winterdienst", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73470", skr04_account: "4235", keywords: ["schnee", "winter"], examples: ["Schneeräumung", "Streudienst"] },
      { category_code: "ALL_HAUSMEISTER", display_name: "Hausmeisterkosten", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73480", skr04_account: "4210", keywords: ["hausmeister", "haustechniker"], examples: ["Hausmeister-Gehalt"] },
      { category_code: "ALL_AUFZUG", display_name: "Aufzugswartung", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73490", skr04_account: "4245", keywords: ["aufzug", "fahrstuhl"], examples: ["Aufzugswartung", "Fahrstuhl-TÜV"] },
      { category_code: "ALL_KABELANSCHLUSS", display_name: "Kabel/Antennenanlage", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73495", skr04_account: "4255", keywords: ["kabel", "antenne", "sat"], examples: ["Kabelanschlussgebühr"] },
      { category_code: "ALL_BRANDSCHUTZ", display_name: "Brandschutz", legal_forms: ["PRIVATPERSON", "GBR", "GMBH", "UG", "AG"], tax_treatment: "SOFORT", allocatable: true, tax_form_lines: {}, skr03_account: "73497", skr04_account: "4257", keywords: ["brandschutz", "feuerlöscher"], examples: ["Feuerlöscher-Wartung"] }
    ];

    let created = 0;
    for (const category of masterCategories) {
      await base44.asServiceRole.entities.TaxCategoryMaster.create(category);
      created++;
    }

    return Response.json({ 
      success: true, 
      message: `${created} Tax-Kategorien erfolgreich erstellt`,
      categories_created: created
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});