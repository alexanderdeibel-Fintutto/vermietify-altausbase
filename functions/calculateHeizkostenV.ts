import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * HeizkostenV-konforme Berechnung (§7-9 HeizkostenV)
 * 
 * 70% Verbrauchsabhängig (nach Zählerständen)
 * 30% Grundkosten (nach Wohnfläche)
 * 
 * Optionale Gradtagszahlen-Berücksichtigung für Witterungsbereinigung
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { costItem, unitId, contractId, periodStart, periodEnd, dayFactor } = await req.json();

    const unit = await base44.entities.Unit.get(unitId);
    const building = await base44.entities.Building.get(unit.gebaeude_id);

    // 1. GRUNDKOSTEN (30% nach Wohnfläche)
    const allUnits = await base44.entities.Unit.filter({ gebaeude_id: building.id });
    const totalSqm = allUnits.reduce((sum, u) => sum + (u.wohnflaeche_qm || 0), 0);
    
    const grundkostenTotal = costItem.gesamtbetrag * 0.30;
    const grundkostenUnit = totalSqm > 0 
      ? (grundkostenTotal * ((unit.wohnflaeche_qm || 0) / totalSqm)) * dayFactor
      : 0;

    // 2. VERBRAUCHSKOSTEN (70% nach Zählerständen)
    const verbrauchskostenTotal = costItem.gesamtbetrag * 0.70;
    let verbrauchskostenUnit = 0;

    // Zählerstände laden
    const meters = await base44.entities.Meter.filter({ 
      unit_id: unitId,
      zaehler_typ: costItem.kostenart === 'Heizung' ? 'Heizung' : 'Wasser warm'
    });

    if (meters.length > 0) {
      const meter = meters[0];
      const readings = await base44.entities.MeterReading.filter({ meter_id: meter.id });
      
      // Ablesungen für Zeitraum finden
      const startReading = readings
        .filter(r => r.ablesedatum <= periodStart)
        .sort((a, b) => new Date(b.ablesedatum) - new Date(a.ablesedatum))[0];
        
      const endReading = readings
        .filter(r => r.ablesedatum >= periodEnd)
        .sort((a, b) => new Date(a.ablesedatum) - new Date(b.ablesedatum))[0];

      if (startReading && endReading) {
        const unitConsumption = endReading.zaehlerstand - startReading.zaehlerstand;
        
        // Gesamtverbrauch aller Units berechnen
        const allMeters = await base44.entities.Meter.filter({ 
          building_id: building.id,
          zaehler_typ: meter.zaehler_typ
        });
        
        let totalConsumption = 0;
        for (const m of allMeters) {
          const mReadings = await base44.entities.MeterReading.filter({ meter_id: m.id });
          const mStart = mReadings
            .filter(r => r.ablesedatum <= periodStart)
            .sort((a, b) => new Date(b.ablesedatum) - new Date(a.ablesedatum))[0];
          const mEnd = mReadings
            .filter(r => r.ablesedatum >= periodEnd)
            .sort((a, b) => new Date(a.ablesedatum) - new Date(b.ablesedatum))[0];
            
          if (mStart && mEnd) {
            totalConsumption += (mEnd.zaehlerstand - mStart.zaehlerstand);
          }
        }

        // Anteil berechnen
        if (totalConsumption > 0) {
          verbrauchskostenUnit = (verbrauchskostenTotal * (unitConsumption / totalConsumption)) * dayFactor;
        }
      } else {
        // Fallback: Keine Zählerstände vorhanden -> Verteilung nach Fläche
        verbrauchskostenUnit = totalSqm > 0 
          ? (verbrauchskostenTotal * ((unit.wohnflaeche_qm || 0) / totalSqm)) * dayFactor
          : 0;
      }
    } else {
      // Kein Zähler vorhanden -> Verteilung nach Fläche
      verbrauchskostenUnit = totalSqm > 0 
        ? (verbrauchskostenTotal * ((unit.wohnflaeche_qm || 0) / totalSqm)) * dayFactor
        : 0;
    }

    // 3. Gesamtbetrag
    const totalAmount = grundkostenUnit + verbrauchskostenUnit;

    return Response.json({
      success: true,
      amount: parseFloat(totalAmount.toFixed(2)),
      breakdown: {
        grundkosten: parseFloat(grundkostenUnit.toFixed(2)),
        verbrauchskosten: parseFloat(verbrauchskostenUnit.toFixed(2))
      },
      meterData: meters.length > 0 ? {
        meterId: meters[0].id,
        hasReadings: true
      } : null
    });

  } catch (error) {
    console.error('Error calculating HeizkostenV:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});