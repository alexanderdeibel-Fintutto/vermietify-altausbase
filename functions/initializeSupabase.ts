import { createClient } from '@supabase/supabase-js';

// Zentrale Supabase-Initialisierung
export function initializeSupabase() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Service-Role Client (für Backend-Funktionen)
export function getServiceRoleClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Service role key missing');
  }

  return createClient(supabaseUrl, serviceKey);
}

// Zentrale Query-Funktionen
export async function loadBuildingsData(orgId) {
  const supabase = initializeSupabase();
  const { data, error } = await supabase
    .from('v_buildings_summary')
    .select('*')
    .eq('org_id', orgId);
  
  if (error) throw error;
  return data;
}

export async function loadOperatingCostStatement(buildingId, year) {
  const supabase = initializeSupabase();
  const { data, error } = await supabase
    .from('operating_cost_statements')
    .select('*')
    .eq('building_id', buildingId)
    .eq('abrechnungsjahr', year)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveOperatingCostStatement(statement) {
  const supabase = initializeSupabase();
  
  if (statement.id) {
    const { data, error } = await supabase
      .from('operating_cost_statements')
      .update(statement)
      .eq('id', statement.id)
      .select();
    if (error) throw error;
    return data[0];
  } else {
    const { data, error } = await supabase
      .from('operating_cost_statements')
      .insert([statement])
      .select();
    if (error) throw error;
    return data[0];
  }
}