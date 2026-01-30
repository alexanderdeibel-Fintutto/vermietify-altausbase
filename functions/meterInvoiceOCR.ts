import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { imageBase64, imageMediaType, building_id, invoice_type } = await req.json();

        // Spezialisierte Prompts für verschiedene Rechnungstypen
        const prompts = {
            energy: `Extrahiere alle Energieverbrauchsdaten aus dieser Rechnung:
- Zählernummer(n) und Typ(en)
- Verbrauchszeitraum (von/bis)
- Aktueller Zählerstand und vorheriger Stand
- Verbrauch in kWh/m³
- Kosten aufgeschlüsselt
- Grundpreis und Arbeitspreis
- Abrechnungszeitraum
- Versorger
Antworte als JSON.`,
            
            water: `Extrahiere Wasserzähler-Daten:
- Zählernummer(n) für Kaltwasser und Warmwasser
- Zählerstände (aktuell und vorherig)
- Verbrauch in m³
- Kosten nach Kalt-/Warmwasser getrennt
- Abrechnungszeitraum
- Wasserversorger
Antworte als JSON.`,
            
            heating: `Extrahiere Heizkosten-Daten:
- Zählernummer(n) für Heizung/Wärmemenge
- Verbrauch in kWh oder Einheiten
- Warmwasser-Anteil
- Grundkosten und Verbrauchskosten
- Brennstoffart (Gas, Öl, Fernwärme)
- Abrechnungszeitraum
Antworte als JSON.`,
            
            general: `Analysiere diese Versorgungsrechnung und extrahiere:
- Alle erkennbaren Zählernummern
- Verbrauchswerte mit Einheiten
- Zeitraum
- Kosten
- Versorger/Anbieter
- Art der Versorgung (Strom, Gas, Wasser, etc.)
Antworte als strukturiertes JSON.`
        };

        const selectedPrompt = prompts[invoice_type] || prompts.general;

        // AI-Analyse mit Vision
        const response = await base44.asServiceRole.functions.invoke('aiCoreService', {
            action: 'ocr',
            prompt: selectedPrompt,
            systemPrompt: `Du bist ein Experte für deutsche Versorgungsrechnungen und Nebenkostenabrechnungen.
Extrahiere alle Daten präzise. Achte auf:
- Deutsche Datumsformate (DD.MM.YYYY)
- Dezimaltrennzeichen (Komma)
- Verschiedene Rechnungslayouts (E.ON, Vattenfall, Stadtwerke, etc.)
- Mehrere Zähler auf einer Rechnung
Antworte nur mit valide strukturiertem JSON.`,
            imageBase64,
            imageMediaType,
            userId: user.email,
            featureKey: 'ocr',
            maxTokens: 4096
        });

        if (!response.data.success) {
            return Response.json({ error: response.data.error }, { status: 400 });
        }

        // Parse extrahierte Daten
        let extracted;
        try {
            extracted = JSON.parse(response.data.content);
        } catch {
            extracted = { raw_text: response.data.content };
        }

        // Intelligente Kategorisierung
        const categorized = await categorizeMeterData(extracted, building_id, base44);

        // Plausibilitätsprüfung
        const validation = await validateExtractedData(extracted, building_id, base44);

        return Response.json({
            success: true,
            extracted_data: extracted,
            categorized_meters: categorized,
            validation_warnings: validation.warnings,
            suggestions: validation.suggestions,
            usage: response.data.usage
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

// Intelligente Kategorisierung
async function categorizeMeterData(data, building_id, base44) {
    const meters = [];

    // Verarbeite extrahierte Zählerdaten
    if (data.zaehler || data.meters || data.zaehlernummern) {
        const meterList = data.zaehler || data.meters || data.zaehlernummern;
        
        for (const meterData of Array.isArray(meterList) ? meterList : [meterList]) {
            const zaehler_nummer = meterData.nummer || meterData.zaehler_nummer || meterData.id;
            
            // Prüfe ob Zähler bereits existiert
            const existing = await base44.asServiceRole.entities.Meter.filter({
                building_id,
                zaehler_nummer
            });

            if (existing.length === 0) {
                meters.push({
                    zaehler_nummer,
                    zaehler_typ: inferMeterType(meterData),
                    einheit: inferUnit(meterData),
                    building_id,
                    versorger: data.versorger || data.supplier || '',
                    aktiv: true,
                    ist_hauptzaehler: meterData.hauptzaehler || false,
                    standort: meterData.standort || 'Aus Rechnung extrahiert'
                });
            }
        }
    }

    return meters;
}

function inferMeterType(meterData) {
    const text = JSON.stringify(meterData).toLowerCase();
    
    if (text.includes('strom') || text.includes('kwh') || text.includes('elektr')) return 'Strom';
    if (text.includes('gas')) return 'Gas';
    if (text.includes('kaltwasser') || text.includes('kalt')) return 'Wasser kalt';
    if (text.includes('warmwasser') || text.includes('warm')) return 'Wasser warm';
    if (text.includes('heiz') || text.includes('wärme')) return 'Heizung';
    
    return 'Strom';
}

function inferUnit(meterData) {
    const text = JSON.stringify(meterData).toLowerCase();
    
    if (text.includes('kwh')) return 'kWh';
    if (text.includes('m³') || text.includes('m3') || text.includes('kubikmeter')) return 'm³';
    if (text.includes('mwh')) return 'MWh';
    
    return 'kWh';
}

async function validateExtractedData(data, building_id, base44) {
    const warnings = [];
    const suggestions = [];

    // Hole existierende Zähler
    const existingMeters = await base44.asServiceRole.entities.Meter.filter({ building_id });

    // Prüfe auf ungewöhnliche Verbräuche
    if (data.verbrauch) {
        const consumption = parseFloat(data.verbrauch);
        if (consumption > 100000) {
            warnings.push({
                type: 'high_consumption',
                message: `Sehr hoher Verbrauch: ${consumption}. Bitte prüfen.`
            });
        }
    }

    // Prüfe auf fehlende Zähler
    if (existingMeters.length === 0) {
        suggestions.push({
            type: 'no_meters_found',
            message: 'Keine Zähler für dieses Gebäude gefunden. Zähler aus dieser Rechnung erstellen?'
        });
    }

    // Prüfe Datumsplausibilität
    if (data.zeitraum_von && data.zeitraum_bis) {
        const von = new Date(data.zeitraum_von);
        const bis = new Date(data.zeitraum_bis);
        const diffDays = (bis - von) / (1000 * 60 * 60 * 24);
        
        if (diffDays > 400) {
            warnings.push({
                type: 'long_period',
                message: `Abrechnungszeitraum ${diffDays} Tage ist ungewöhnlich lang.`
            });
        }
    }

    return { warnings, suggestions };
}