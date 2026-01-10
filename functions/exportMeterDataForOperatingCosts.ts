import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      building_id, 
      period_start, 
      period_end, 
      export_format = 'csv',
      group_by = 'meter' // 'meter' or 'unit'
    } = await req.json();

    // Fetch meters
    const meters = await base44.entities.Meter.filter(
      building_id ? { building_id } : {},
      'location',
      500
    );

    // Fetch readings in period
    const allReadings = await base44.entities.MeterReading.list('-reading_date', 2000);
    const readings = allReadings.filter(r => {
      const date = new Date(r.reading_date);
      return date >= new Date(period_start) && date <= new Date(period_end);
    });

    // Fetch building and units
    const building = building_id 
      ? (await base44.entities.Building.filter({ id: building_id }, null, 1))[0]
      : null;
    
    const units = building_id
      ? await base44.entities.Unit.filter({ building_id }, null, 100)
      : [];

    // Prepare export data
    const exportData = [];

    if (group_by === 'meter') {
      // Group by meter
      meters.forEach(meter => {
        const meterReadings = readings.filter(r => r.meter_id === meter.id);
        const totalConsumption = meterReadings.reduce((acc, r) => acc + (r.consumption || 0), 0);
        
        if (meterReadings.length > 0) {
          exportData.push({
            Gebäude: building?.name || '',
            Zählernummer: meter.meter_number,
            Standort: meter.location,
            Typ: meter.meter_type,
            Anzahl_Ablesungen: meterReadings.length,
            Gesamtverbrauch: totalConsumption,
            Einheit: meter.unit,
            Zeitraum_von: period_start,
            Zeitraum_bis: period_end
          });
        }
      });
    } else {
      // Group by unit (distribute consumption)
      units.forEach(unit => {
        const unitConsumption = {};
        
        meters.forEach(meter => {
          const meterReadings = readings.filter(r => r.meter_id === meter.id);
          const totalConsumption = meterReadings.reduce((acc, r) => acc + (r.consumption || 0), 0);
          
          // Simple distribution: divide by number of units
          const share = totalConsumption / units.length;
          
          if (!unitConsumption[meter.meter_type]) {
            unitConsumption[meter.meter_type] = 0;
          }
          unitConsumption[meter.meter_type] += share;
        });

        exportData.push({
          Einheit: unit.unit_number,
          Gebäude: building?.name || '',
          Strom: Math.round(unitConsumption.electricity || 0),
          Wasser: Math.round(unitConsumption.water || 0),
          Gas: Math.round(unitConsumption.gas || 0),
          Heizung: Math.round(unitConsumption.heating || 0),
          Zeitraum_von: period_start,
          Zeitraum_bis: period_end
        });
      });
    }

    // Export as CSV
    if (export_format === 'csv') {
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(';'),
        ...exportData.map(row => headers.map(h => row[h] || '').join(';'))
      ].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=verbrauchsdaten_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

    // Export as PDF
    if (export_format === 'pdf') {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text('Verbrauchsdatenexport', 20, 20);

      doc.setFontSize(10);
      doc.text(`Zeitraum: ${new Date(period_start).toLocaleDateString('de-DE')} - ${new Date(period_end).toLocaleDateString('de-DE')}`, 20, 30);
      if (building) {
        doc.text(`Gebäude: ${building.name}`, 20, 36);
      }

      // Table
      let y = 50;
      doc.setFontSize(12);
      
      if (group_by === 'meter') {
        doc.text('Zähler', 20, y);
        doc.text('Standort', 70, y);
        doc.text('Verbrauch', 130, y);
        doc.text('Einheit', 170, y);
        y += 10;

        doc.setFontSize(10);
        exportData.forEach(row => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(row.Zählernummer || '', 20, y);
          doc.text(row.Standort || '', 70, y);
          doc.text(String(row.Gesamtverbrauch || 0), 130, y);
          doc.text(row.Einheit || '', 170, y);
          y += 8;
        });
      } else {
        doc.text('Einheit', 20, y);
        doc.text('Strom', 60, y);
        doc.text('Wasser', 90, y);
        doc.text('Gas', 120, y);
        doc.text('Heizung', 150, y);
        y += 10;

        doc.setFontSize(10);
        exportData.forEach(row => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(row.Einheit || '', 20, y);
          doc.text(String(row.Strom || 0), 60, y);
          doc.text(String(row.Wasser || 0), 90, y);
          doc.text(String(row.Gas || 0), 120, y);
          doc.text(String(row.Heizung || 0), 150, y);
          y += 8;
        });
      }

      // Summary
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Zusammenfassung', 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Zeitraum: ${new Date(period_start).toLocaleDateString('de-DE')} - ${new Date(period_end).toLocaleDateString('de-DE')}`, 20, 30);
      doc.text(`Anzahl Zähler: ${meters.length}`, 20, 38);
      doc.text(`Anzahl Ablesungen: ${readings.length}`, 20, 46);
      doc.text(`Exportiert am: ${new Date().toLocaleDateString('de-DE')}`, 20, 54);

      const pdfBytes = doc.output('arraybuffer');

      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=verbrauchsdaten_${new Date().toISOString().split('T')[0]}.pdf`
        }
      });
    }

    // Default JSON response
    return Response.json({
      success: true,
      data: exportData,
      count: exportData.length
    });

  } catch (error) {
    console.error('Export meter data error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});