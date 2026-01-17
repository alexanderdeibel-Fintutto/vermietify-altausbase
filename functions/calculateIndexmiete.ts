import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const base44 = createClientFromRequest(req);
  
  try {
    const body = await req.json();
    
    const {
      miete_aktuell,
      letzte_anpassung_datum,
      schwellenwert = 0
    } = body;
    
    if (!miete_aktuell || !letzte_anpassung_datum) {
      return Response.json(
        { success: false, error: 'Aktuelle Miete und letztes Anpassungsdatum erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const letzteAnpassung = new Date(letzte_anpassung_datum);
    const heute = new Date();
    
    // Get VPI indices
    const vpiAlt = await getVPI(base44, letzteAnpassung.getFullYear(), letzteAnpassung.getMonth() + 1);
    const vpiNeu = await getVPI(base44, heute.getFullYear(), heute.getMonth() + 1);
    
    // Berechnungen
    const steigerung_prozent = ((vpiNeu - vpiAlt) / vpiAlt) * 100;
    const neue_miete = miete_aktuell * (vpiNeu / vpiAlt);
    const differenz = neue_miete - miete_aktuell;
    const anpassung_moeglich = schwellenwert === 0 || steigerung_prozent >= schwellenwert;
    
    return Response.json({
      success: true,
      result: {
        miete_aktuell,
        neue_miete: Math.round(neue_miete * 100) / 100,
        differenz: Math.round(differenz * 100) / 100,
        steigerung_prozent: Math.round(steigerung_prozent * 100) / 100,
        vpi_alt: vpiAlt,
        vpi_neu: vpiNeu,
        anpassung_moeglich,
        schwellenwert_erreicht: steigerung_prozent >= schwellenwert,
        letzte_anpassung: letzte_anpassung_datum,
        berechnungsdatum: heute.toISOString()
      }
    }, { headers: corsHeaders });
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
});

async function getVPI(base44, year, month) {
  const results = await base44.asServiceRole.entities.VPIIndex.filter({ 
    year: year, 
    month: month 
  });
  
  if (results.length === 0) {
    throw new Error(`VPI-Index für ${month}/${year} nicht gefunden`);
  }
  
  return results[0].index_value;
}