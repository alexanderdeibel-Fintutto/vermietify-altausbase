import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meter_id, new_reading, reading_date } = await req.json();

    // Fetch meter and historical readings
    const meters = await base44.entities.Meter.filter({ id: meter_id }, null, 1);
    const meter = meters[0];

    if (!meter) {
      return Response.json({ error: 'Meter not found' }, { status: 404 });
    }

    const historicalReadings = await base44.entities.MeterReading.filter(
      { meter_id },
      '-reading_date',
      12
    );

    const warnings = [];
    let passed = true;

    // Check 1: Reading should be higher than last reading
    if (meter.current_reading && new_reading < meter.current_reading) {
      warnings.push(`Neuer Wert (${new_reading}) niedriger als aktueller Stand (${meter.current_reading})`);
      passed = false;
    }

    // Check 2: Calculate expected consumption based on history
    if (historicalReadings.length >= 2) {
      const avgConsumption = historicalReadings.slice(0, -1).reduce((acc, r, i) => {
        if (i === 0) return acc;
        const consumption = historicalReadings[i - 1].reading_value - r.reading_value;
        return acc + consumption;
      }, 0) / (historicalReadings.length - 1);

      const expectedReading = meter.current_reading + avgConsumption;
      const deviation = Math.abs(new_reading - expectedReading) / expectedReading;

      // Check 3: Consumption deviation > 50%
      if (deviation > 0.5) {
        warnings.push(`Verbrauch weicht ${Math.round(deviation * 100)}% vom Durchschnitt ab (erwartet: ~${Math.round(expectedReading)})`);
      }

      // Check 4: Unrealistic consumption (too high)
      if (deviation > 2.0) {
        warnings.push(`Unrealistisch hoher Verbrauch! Bitte Ablesung überprüfen.`);
        passed = false;
      }
    }

    // Check 5: Date in future
    const readingDateObj = new Date(reading_date);
    if (readingDateObj > new Date()) {
      warnings.push('Ablesedatum liegt in der Zukunft');
      passed = false;
    }

    // Check 6: Very old reading
    const daysSinceReading = (new Date() - readingDateObj) / (1000 * 60 * 60 * 24);
    if (daysSinceReading > 7) {
      warnings.push(`Ablesung ist ${Math.round(daysSinceReading)} Tage alt`);
    }

    // Calculate consumption
    const consumption = meter.current_reading 
      ? new_reading - meter.current_reading 
      : null;

    // Expected range
    const expectedRange = historicalReadings.length >= 2 ? {
      min: meter.current_reading,
      max: meter.current_reading + (avgConsumption * 1.5),
      avg: meter.current_reading + avgConsumption
    } : null;

    return Response.json({
      success: true,
      plausibility_check: {
        passed,
        warnings,
        expected_range: expectedRange
      },
      consumption,
      previous_reading: meter.current_reading,
      anomaly_detected: warnings.length > 0,
      can_proceed: warnings.length === 0 || warnings.every(w => !w.includes('Unrealistisch'))
    });

  } catch (error) {
    console.error('Validate meter reading error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});