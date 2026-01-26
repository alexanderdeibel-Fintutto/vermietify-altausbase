import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Lädt Zählerstände für einen Abrechnungszeitraum
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unitIds, periodStart, periodEnd, meterType } = await req.json();

    // Alle Zähler für die Units laden
    const allMeters = await base44.entities.Meter.list();
    const meters = allMeters.filter(m => 
      unitIds.includes(m.unit_id) && 
      (!meterType || m.zaehler_typ === meterType)
    );

    const result = [];

    for (const meter of meters) {
      const allReadings = await base44.entities.MeterReading.filter({ meter_id: meter.id });
      
      // Start-Ablesung (vor oder am Startdatum)
      const startReading = allReadings
        .filter(r => r.ablesedatum <= periodStart)
        .sort((a, b) => new Date(b.ablesedatum) - new Date(a.ablesedatum))[0];
      
      // End-Ablesung (am oder nach Enddatum)
      const endReading = allReadings
        .filter(r => r.ablesedatum >= periodEnd)
        .sort((a, b) => new Date(a.ablesedatum) - new Date(b.ablesedatum))[0];

      const consumption = startReading && endReading 
        ? endReading.zaehlerstand - startReading.zaehlerstand 
        : null;

      result.push({
        meter_id: meter.id,
        meter_number: meter.zaehler_nummer,
        meter_type: meter.zaehler_typ,
        unit_id: meter.unit_id,
        start_reading: startReading?.zaehlerstand || null,
        end_reading: endReading?.zaehlerstand || null,
        consumption,
        has_complete_data: !!consumption,
        start_date: startReading?.ablesedatum || null,
        end_date: endReading?.ablesedatum || null
      });
    }

    return Response.json({
      success: true,
      meters: result,
      total_consumption: result
        .filter(m => m.consumption !== null)
        .reduce((sum, m) => sum + m.consumption, 0),
      complete_meters: result.filter(m => m.has_complete_data).length,
      total_meters: result.length
    });

  } catch (error) {
    console.error('Error getting meter readings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});