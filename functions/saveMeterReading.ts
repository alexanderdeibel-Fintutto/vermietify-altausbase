import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      meter_id, 
      reading_value, 
      reading_date, 
      image_url,
      auto_detected,
      notes 
    } = await req.json();

    // Validate required fields
    if (!meter_id || reading_value === undefined || reading_value === null) {
      return Response.json({ 
        error: 'Meter ID and reading value are required',
        success: false
      }, { status: 400 });
    }

    // Fetch meter to get current reading
    const meters = await base44.entities.Meter.filter({ id: meter_id }, null, 1);
    const meter = meters[0];

    if (!meter) {
      return Response.json({ 
        error: 'Meter not found',
        success: false
      }, { status: 404 });
    }

    // Validate reading (should be higher than previous)
    if (meter.current_reading && reading_value < meter.current_reading) {
      return Response.json({ 
        error: `Neuer Stand (${reading_value}) ist niedriger als vorheriger Stand (${meter.current_reading})`,
        success: false,
        warning: true
      }, { status: 400 });
    }

    // Calculate consumption
    const consumption = meter.current_reading 
      ? reading_value - meter.current_reading 
      : null;

    // Update meter with new reading
    await base44.asServiceRole.entities.Meter.update(meter_id, {
      current_reading: reading_value,
      last_reading_date: reading_date || new Date().toISOString(),
      last_reading_by: user.email
    });

    // Create reading history entry (if you have such entity)
    // This would track all historical readings
    try {
      await base44.asServiceRole.entities.Document.create({
        name: `Zählerablesung ${meter.meter_number}`,
        category: 'Sonstiges',
        status: 'erstellt',
        file_url: image_url,
        file_type: 'image',
        building_id: meter.building_id,
        notes: `Zählerstand: ${reading_value} ${meter.unit || ''}\n` +
               `${auto_detected ? 'Automatisch erkannt' : 'Manuell eingegeben'}\n` +
               `Verbrauch: ${consumption ? consumption.toFixed(2) : 'N/A'} ${meter.unit || ''}${notes ? `\n${notes}` : ''}`
      });
    } catch (docError) {
      console.error('Failed to create document:', docError);
    }

    return Response.json({
      success: true,
      meter_id,
      reading_value,
      previous_reading: meter.current_reading,
      consumption,
      message: 'Zählerstand erfolgreich gespeichert'
    });

  } catch (error) {
    console.error('Save meter reading error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});