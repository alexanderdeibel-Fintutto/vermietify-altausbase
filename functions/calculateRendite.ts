import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { 
            kaufpreis, 
            nebenkosten_prozent = 10, 
            eigenkapital, 
            zinssatz = 3, 
            tilgung = 2,
            jahresmiete,
            bewirtschaftungskosten_prozent = 20,
            instandhaltung_prozent = 1
        } = await req.json();

        if (!kaufpreis || !jahresmiete) {
            return Response.json({ error: 'Kaufpreis und Jahresmiete sind erforderlich' }, { status: 400 });
        }

        // Berechnungen
        const nebenkosten = kaufpreis * (nebenkosten_prozent / 100);
        const gesamtinvestition = kaufpreis + nebenkosten;
        const darlehensbetrag = gesamtinvestition - (eigenkapital || 0);
        
        const jaehrliche_zinsen = darlehensbetrag * (zinssatz / 100);
        const jaehrliche_tilgung = darlehensbetrag * (tilgung / 100);
        const jaehrlicher_kapitaldienst = jaehrliche_zinsen + jaehrliche_tilgung;
        
        const bewirtschaftungskosten = jahresmiete * (bewirtschaftungskosten_prozent / 100);
        const instandhaltungsruecklage = kaufpreis * (instandhaltung_prozent / 100);
        const gesamtkosten = bewirtschaftungskosten + instandhaltungsruecklage + jaehrlicher_kapitaldienst;
        
        const netto_cashflow = jahresmiete - gesamtkosten;
        const brutto_mietrendite = (jahresmiete / kaufpreis) * 100;
        const netto_mietrendite = ((jahresmiete - bewirtschaftungskosten - instandhaltungsruecklage) / gesamtinvestition) * 100;
        const eigenkapitalrendite = eigenkapital > 0 ? (netto_cashflow / eigenkapital) * 100 : 0;

        const result = {
            gesamtinvestition,
            darlehensbetrag,
            jaehrlicher_kapitaldienst,
            netto_cashflow,
            brutto_mietrendite: Math.round(brutto_mietrendite * 100) / 100,
            netto_mietrendite: Math.round(netto_mietrendite * 100) / 100,
            eigenkapitalrendite: Math.round(eigenkapitalrendite * 100) / 100,
            monatlicher_cashflow: Math.round((netto_cashflow / 12) * 100) / 100
        };

        return Response.json({ success: true, result });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});