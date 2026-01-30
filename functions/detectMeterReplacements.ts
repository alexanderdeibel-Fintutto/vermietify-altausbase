import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Alle aktiven Zähler
        const meters = await base44.asServiceRole.entities.Meter.filter({ aktiv: true });
        const alerts = [];

        for (const meter of meters) {
            const needsReplacement = [];
            const reasons = [];

            // 1. Eichfrist prüfen
            if (meter.eichung_bis) {
                const eichungDate = new Date(meter.eichung_bis);
                const today = new Date();
                const daysUntil = Math.ceil((eichungDate - today) / (1000 * 60 * 60 * 24));

                if (daysUntil < 0) {
                    needsReplacement.push({
                        type: 'calibration_due',
                        priority: 'urgent',
                        days: Math.abs(daysUntil),
                        message: `Eichfrist abgelaufen (seit ${Math.abs(daysUntil)} Tagen)`
                    });
                } else if (daysUntil < 180) {
                    needsReplacement.push({
                        type: 'calibration_due',
                        priority: daysUntil < 60 ? 'high' : 'medium',
                        days: daysUntil,
                        message: `Eichfrist läuft in ${daysUntil} Tagen ab`
                    });
                }
            }

            // 2. Alter des Zählers (heuristisch über Ablesungen)
            const readings = await base44.asServiceRole.entities.MeterReading.filter({
                meter_id: meter.id
            }, 'ablesedatum', 1);

            if (readings.length > 0) {
                const firstReading = new Date(readings[0].ablesedatum);
                const ageYears = (new Date() - firstReading) / (1000 * 60 * 60 * 24 * 365);

                // Typische Lebensdauern
                const lifespans = {
                    'Strom': 16,
                    'Gas': 12,
                    'Wasser kalt': 6,
                    'Wasser warm': 6,
                    'Heizung': 12,
                    'Wärmemenge': 10
                };

                const expectedLife = lifespans[meter.zaehler_typ] || 10;

                if (ageYears > expectedLife) {
                    needsReplacement.push({
                        type: 'age_based',
                        priority: 'high',
                        days: 0,
                        message: `Zähler ist ${ageYears.toFixed(1)} Jahre alt (typische Lebensdauer: ${expectedLife} Jahre)`
                    });
                } else if (ageYears > expectedLife * 0.8) {
                    needsReplacement.push({
                        type: 'age_based',
                        priority: 'medium',
                        days: Math.ceil((expectedLife - ageYears) * 365),
                        message: `Zähler nähert sich Ende der Lebensdauer (${ageYears.toFixed(1)} von ${expectedLife} Jahren)`
                    });
                }
            }

            // 3. Verbrauchsanomalien erkennen
            const recentReadings = await base44.asServiceRole.entities.MeterReading.filter({
                meter_id: meter.id
            }, '-ablesedatum', 6);

            if (recentReadings.length >= 4) {
                const consumptions = recentReadings
                    .map(r => r.verbrauch_seit_letzter)
                    .filter(v => v > 0);

                if (consumptions.length >= 3) {
                    const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
                    const stdDev = Math.sqrt(
                        consumptions.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / consumptions.length
                    );

                    // Letzte Ablesung ist Outlier?
                    const latest = consumptions[0];
                    if (Math.abs(latest - avg) > 2 * stdDev) {
                        needsReplacement.push({
                            type: 'usage_anomaly',
                            priority: 'medium',
                            days: 30,
                            message: `Ungewöhnlicher Verbrauch: ${latest} vs. Durchschnitt ${avg.toFixed(0)} ${meter.einheit}`
                        });
                    }
                }
            }

            // Erstelle Alert wenn nötig
            if (needsReplacement.length > 0) {
                const highestPriority = needsReplacement.reduce((max, item) => {
                    const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
                    return priorities[item.priority] > priorities[max.priority] ? item : max;
                });

                // Geschätzte Kosten
                const costs = {
                    'Strom': 150,
                    'Gas': 120,
                    'Wasser kalt': 80,
                    'Wasser warm': 100,
                    'Heizung': 200,
                    'Wärmemenge': 180
                };

                const alert = {
                    meter_id: meter.id,
                    alert_type: highestPriority.type,
                    priority: highestPriority.priority,
                    recommended_action: needsReplacement.map(r => r.message).join('; '),
                    estimated_cost: costs[meter.zaehler_typ] || 100,
                    days_until_required: highestPriority.days,
                    ai_confidence: 85,
                    status: 'pending',
                    supporting_data: {
                        meter_type: meter.zaehler_typ,
                        meter_number: meter.zaehler_nummer,
                        reasons: needsReplacement
                    }
                };

                // Prüfe ob Alert bereits existiert
                const existing = await base44.asServiceRole.entities.MeterReplacementAlert.filter({
                    meter_id: meter.id,
                    status: { $in: ['pending', 'acknowledged'] }
                });

                if (existing.length === 0) {
                    await base44.asServiceRole.entities.MeterReplacementAlert.create(alert);
                    alerts.push(alert);
                }
            }
        }

        return Response.json({
            success: true,
            meters_analyzed: meters.length,
            alerts_created: alerts.length,
            alerts
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});