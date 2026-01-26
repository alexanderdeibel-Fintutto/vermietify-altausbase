import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Generates operating cost statement for a building
 */
Deno.serve(async (req) => {
  try {
    const { buildingId, year } = await req.json();

    if (!buildingId || !year) {
      return Response.json({ error: 'buildingId and year required' }, { status: 400 });
    }

    // Get all units and leases for the building
    const { data: units, error: unitsError } = await supabase
      .from('v_units_with_lease')
      .select('*')
      .eq('building_id', buildingId);

    if (unitsError) throw unitsError;

    // Get meter readings for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: readings, error: readingsError } = await supabase
      .from('meter_readings')
      .select('*')
      .eq('building_id', buildingId)
      .gte('reading_date', startDate)
      .lte('reading_date', endDate);

    if (readingsError) throw readingsError;

    // Calculate total area and persons
    const totalArea = units.reduce((sum, u) => sum + (u.wohnflaeche_qm || 0), 0);
    const totalPersons = units.length;

    // Create statement
    const { data: statement, error: createError } = await supabase
      .from('operating_cost_statements')
      .insert([{
        building_id: buildingId,
        abrechnungsjahr: year,
        zeitraum_von: startDate,
        zeitraum_bis: endDate,
        erstellungsdatum: new Date().toISOString().split('T')[0],
        gesamtflaeche: totalArea,
        gesamtpersonen: totalPersons,
        status: 'Entwurf'
      }])
      .select()
      .single();

    if (createError) throw createError;

    return Response.json({
      success: true,
      statement: statement,
      units: units.length,
      meterReadings: readings.length
    });
  } catch (error) {
    console.error('Error generating operating cost statement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});