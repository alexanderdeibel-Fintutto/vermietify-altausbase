import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageBase64, imageMediaType, building_id } = await req.json();

        // OCR + Kategorisierung via AI
        const response = await base44.asServiceRole.functions.invoke('aiCoreService', {
            action: 'ocr',
            prompt: 'Extrahiere Zähler-Daten aus diesem Bild. Gib zurück: zaehler_nummer, zaehler_typ ("Strom"|"Gas"|"Wasser kalt"|"Wasser warm"|"Heizung"|"Wärmemenge"), standort, versorger, einheit ("kWh"|"m³"|"MWh"), eichung_bis (Datum falls erkennbar), aktueller_stand (Zählerstand falls sichtbar)',
            systemPrompt: 'Du bist ein Experte für Energiezähler. Extrahiere alle relevanten Daten präzise.',
            imageBase64,
            imageMediaType,
            userId: user.email,
            featureKey: 'ocr',
            maxTokens: 2048
        });

        if (!response.data.success) {
            return Response.json({ error: response.data.error }, { status: 400 });
        }

        const extracted = JSON.parse(response.data.content);

        // Auto-Kategorisierung
        let kategorie_vorschlag = 'Keine';
        if (extracted.zaehler_typ === 'Strom') kategorie_vorschlag = 'Allgemeinstrom';
        if (extracted.zaehler_typ === 'Gas') kategorie_vorschlag = 'Gasversorgung';
        if (extracted.zaehler_typ?.includes('Wasser')) kategorie_vorschlag = 'Wasserversorgung';
        if (extracted.zaehler_typ === 'Heizung') kategorie_vorschlag = 'Heizkosten';

        // Prüfe ob Eichung bald abläuft
        let eichung_warnung = false;
        if (extracted.eichung_bis) {
            const eichungsDatum = new Date(extracted.eichung_bis);
            const heute = new Date();
            const differenz = (eichungsDatum - heute) / (1000 * 60 * 60 * 24);
            if (differenz < 180 && differenz > 0) {
                eichung_warnung = true;
            }
        }

        return Response.json({
            success: true,
            extracted_data: {
                ...extracted,
                kategorie_vorschlag,
                eichung_warnung,
                ist_hauptzaehler: false,
                aktiv: true,
                building_id
            },
            usage: response.data.usage
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});