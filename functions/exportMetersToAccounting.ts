import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reading_ids, export_format = 'csv', period_start, period_end } = await req.json();

    // Fetch readings
    const allReadings = await base44.entities.MeterReading.filter(
      reading_ids ? { id: { $in: reading_ids } } : {},
      '-reading_date',
      1000
    );

    // Filter by period if specified
    const readings = period_start && period_end 
      ? allReadings.filter(r => {
          const date = new Date(r.reading_date);
          return date >= new Date(period_start) && date <= new Date(period_end);
        })
      : allReadings;

    // Fetch related meters and buildings
    const meterIds = [...new Set(readings.map(r => r.meter_id))];
    const meters = await base44.entities.Meter.filter(
      { id: { $in: meterIds } },
      null,
      1000
    );

    const buildingIds = [...new Set(meters.map(m => m.building_id))];
    const buildings = await base44.entities.Building.filter(
      { id: { $in: buildingIds } },
      null,
      100
    );

    // Prepare export data
    const exportData = readings.map(reading => {
      const meter = meters.find(m => m.id === reading.meter_id);
      const building = buildings.find(b => b.id === meter?.building_id);

      return {
        Datum: new Date(reading.reading_date).toLocaleDateString('de-DE'),
        Gebäude: building?.name || '',
        'Gebäude-ID': building?.id || '',
        Zählernummer: meter?.meter_number || '',
        Standort: meter?.location || '',
        Typ: meter?.meter_type || '',
        Zählerstand: reading.reading_value,
        Verbrauch: reading.consumption || 0,
        Einheit: meter?.unit || '',
        'Abgelesen von': reading.read_by || '',
        'Auto-Erkannt': reading.auto_detected ? 'Ja' : 'Nein',
        Genauigkeit: reading.confidence_score ? Math.round(reading.confidence_score * 100) + '%' : ''
      };
    });

    // Generate CSV
    if (export_format === 'csv') {
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(';'),
        ...exportData.map(row => headers.map(h => row[h]).join(';'))
      ].join('\n');

      // Mark as exported
      for (const reading of readings) {
        await base44.asServiceRole.entities.MeterReading.update(reading.id, {
          exported_to_accounting: true,
          export_date: new Date().toISOString()
        });
      }

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=zaehlerstaende_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

    // JSON format
    return Response.json({
      success: true,
      data: exportData,
      count: exportData.length
    });

  } catch (error) {
    console.error('Export meters error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});