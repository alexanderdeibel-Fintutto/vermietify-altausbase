const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    
    const {
      kaufpreis,
      nebenkosten_prozent = 10,
      miete_kalt_monat,
      nicht_umlagefaehig_monat = 0,
      eigenkapital = 0,
      zinssatz = 0
    } = body;
    
    // Validierung
    if (!kaufpreis || !miete_kalt_monat) {
      return Response.json(
        { success: false, error: 'Kaufpreis und Miete erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Berechnungen
    const nebenkosten = kaufpreis * (nebenkosten_prozent / 100);
    const gesamtkosten = kaufpreis + nebenkosten;
    
    const jahresmiete_brutto = miete_kalt_monat * 12;
    const jahresmiete_netto = (miete_kalt_monat - nicht_umlagefaehig_monat) * 12;
    
    const brutto_rendite = (jahresmiete_brutto / kaufpreis) * 100;
    const netto_rendite = (jahresmiete_netto / gesamtkosten) * 100;
    
    const kaufpreis_faktor = kaufpreis / jahresmiete_brutto;
    
    // Finanzierung
    const darlehensbetrag = gesamtkosten - eigenkapital;
    const jahres_zins = darlehensbetrag * (zinssatz / 100);
    const monatliche_zinskosten = jahres_zins / 12;
    
    const cashflow_monat = miete_kalt_monat - nicht_umlagefaehig_monat - monatliche_zinskosten;
    const cashflow_jahr = cashflow_monat * 12;
    
    const eigenkapital_rendite = eigenkapital > 0 ? (cashflow_jahr / eigenkapital) * 100 : 0;
    
    // Bewertung
    let bewertung = 'niedrig';
    if (brutto_rendite >= 5) bewertung = 'gut';
    else if (brutto_rendite >= 3) bewertung = 'durchschnittlich';
    
    return Response.json({
      success: true,
      result: {
        brutto_rendite: Math.round(brutto_rendite * 100) / 100,
        netto_rendite: Math.round(netto_rendite * 100) / 100,
        kaufpreis_faktor: Math.round(kaufpreis_faktor * 10) / 10,
        eigenkapital_rendite: Math.round(eigenkapital_rendite * 100) / 100,
        gesamtkosten: Math.round(gesamtkosten * 100) / 100,
        nebenkosten: Math.round(nebenkosten * 100) / 100,
        jahresmiete_brutto: Math.round(jahresmiete_brutto * 100) / 100,
        jahresmiete_netto: Math.round(jahresmiete_netto * 100) / 100,
        darlehensbetrag: Math.round(darlehensbetrag * 100) / 100,
        monatliche_zinskosten: Math.round(monatliche_zinskosten * 100) / 100,
        cashflow_monat: Math.round(cashflow_monat * 100) / 100,
        cashflow_jahr: Math.round(cashflow_jahr * 100) / 100,
        bewertung
      }
    }, { headers: corsHeaders });
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
});