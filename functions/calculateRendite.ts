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

  try {
    const { kaufpreis, nebenkosten_prozent = 10, miete_kalt_monat, nicht_umlagefaehig_monat = 0 } = await req.json();

    if (!kaufpreis || !miete_kalt_monat) {
      return Response.json({ success: false, error: 'Kaufpreis und Miete erforderlich' }, { status: 400, headers: corsHeaders });
    }

    const gesamtkosten = kaufpreis * (1 + nebenkosten_prozent / 100);
    const jahresmiete_brutto = miete_kalt_monat * 12;
    const jahresmiete_netto = (miete_kalt_monat - nicht_umlagefaehig_monat) * 12;

    const brutto_rendite = (jahresmiete_brutto / kaufpreis) * 100;
    const netto_rendite = (jahresmiete_netto / gesamtkosten) * 100;
    const kaufpreis_faktor = kaufpreis / jahresmiete_brutto;

    const bewertung = brutto_rendite >= 5 ? 'gut' : brutto_rendite >= 3 ? 'durchschnittlich' : 'niedrig';

    return Response.json({
      success: true,
      result: {
        brutto_rendite: Math.round(brutto_rendite * 100) / 100,
        netto_rendite: Math.round(netto_rendite * 100) / 100,
        kaufpreis_faktor: Math.round(kaufpreis_faktor * 10) / 10,
        gesamtkosten,
        jahresmiete_brutto,
        jahresmiete_netto,
        bewertung
      }
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
});