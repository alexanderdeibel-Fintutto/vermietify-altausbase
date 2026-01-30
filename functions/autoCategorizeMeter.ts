import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { meter_id } = await req.json();

        // Hole Zähler und Ablesungen
        const meter = await base44.entities.Meter.get(meter_id);
        const readings = await base44.entities.MeterReading.filter({
            meter_id
        }, '-ablesedatum', 12);

        if (readings.length < 3) {
            return Response.json({ 
                success: false,
                error: 'Nicht genug Ablesungen für Analyse (min. 3 benötigt)'
            });
        }

        // Analysiere Nutzungsmuster mit AI
        const analysisPrompt = `Analysiere diesen Zähler und kategorisiere ihn basierend auf Nutzungsmustern:

Zähler-Info:
- Typ: ${meter.zaehler_typ}
- Nummer: ${meter.zaehler_nummer}
- Einheit: ${meter.einheit}
- Standort: ${meter.standort}

Ablesungen (letzte 12):
${readings.map(r => `- ${r.ablesedatum}: ${r.zaehlerstand} ${meter.einheit} (Verbrauch: ${r.verbrauch_seit_letzter || 'N/A'})`).join('\n')}

Aufgaben:
1. Identifiziere Nutzungsmuster (konstant, saisonal, unregelmäßig)
2. Kategorisiere: Hauptzähler, Nebenzähler, Allgemeinzähler, oder Einzelwohnung
3. Erkenne Anomalien im Verbrauch
4. Schätze den typischen Jahresverbrauch
5. Empfehle Optimierungsmaßnahmen

Antworte als JSON:
{
  "pattern": "konstant|saisonal|unregelmäßig",
  "category": "hauptzaehler|nebenzaehler|allgemein|einzelwohnung",
  "ist_hauptzaehler": true/false,
  "anomalies": ["..."],
  "estimated_yearly_consumption": number,
  "optimization_suggestions": ["..."],
  "confidence": 0-100
}`;

        const response = await base44.functions.invoke('aiCoreService', {
            action: 'analysis',
            prompt: analysisPrompt,
            userId: user.email,
            featureKey: 'analysis',
            maxTokens: 2048
        });

        if (!response.data.success) {
            return Response.json({ error: response.data.error }, { status: 400 });
        }

        const analysis = JSON.parse(response.data.content);

        // Update Meter mit AI-Erkenntnissen
        await base44.entities.Meter.update(meter_id, {
            ist_hauptzaehler: analysis.ist_hauptzaehler,
            bemerkungen: `AI-Kategorisierung (${new Date().toLocaleDateString('de-DE')}): ${analysis.category}, Muster: ${analysis.pattern}, Konfidenz: ${analysis.confidence}%`
        });

        // Erstelle Empfehlungen wenn vorhanden
        if (analysis.optimization_suggestions?.length > 0) {
            for (const suggestion of analysis.optimization_suggestions) {
                await base44.asServiceRole.entities.AIProactiveRecommendation.create({
                    recommendation_type: 'efficiency_improvement',
                    title: `Optimierung für Zähler ${meter.zaehler_nummer}`,
                    description: suggestion,
                    target_entity_type: 'Meter',
                    target_entity_id: meter_id,
                    priority_score: 60,
                    implementation_effort: 'low',
                    ai_confidence: analysis.confidence,
                    status: 'new'
                });
            }
        }

        return Response.json({
            success: true,
            analysis,
            meter_updated: true,
            recommendations_created: analysis.optimization_suggestions?.length || 0,
            usage: response.data.usage
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});