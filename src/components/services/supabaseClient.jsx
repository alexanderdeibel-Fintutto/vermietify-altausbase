import { createClient } from '@supabase/supabase-js';
import { base44 } from '@/api/base44Client';

// Secrets werden in Base44 direkt vom Backend bereitgestellt
const supabaseUrl = window.__SUPABASE_URL__ || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = window.__SUPABASE_KEY__ || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials via env vars not found, using base44 SDK instead');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fallback: Nutze base44 SDK statt direktem Supabase-Zugriff
export async function safeQuery(queryFn) {
  if (!supabase) {
    console.error('Supabase client not initialized. Use base44.entities instead.');
    return null;
  }
  try {
    const { data, error } = await queryFn();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Query error:', error);
    return null;
  }
}

// Zentrale Hilfsfunktionen für sichere Queries
export async function safeQuery(queryFn) {
  try {
    const { data, error } = await queryFn();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Query error:', error);
    return null;
  }
}

// Daten-Loading Funktionen
export async function loadBuildings(orgId) {
  return safeQuery(() =>
    supabase
      .from('v_buildings_summary')
      .select('*')
      .eq('org_id', orgId)
      .order('name')
  );
}

export async function loadUnits(buildingId) {
  return safeQuery(() =>
    supabase
      .from('v_units_with_lease')
      .select('*')
      .eq('building_id', buildingId)
      .order('unit_number')
  );
}

export async function loadActiveLeases(buildingId) {
  return safeQuery(() =>
    supabase
      .from('v_active_leases')
      .select('*')
      .eq('building_id', buildingId)
  );
}

export async function loadMetersWithReadings(buildingId) {
  return safeQuery(() =>
    supabase
      .from('v_meters_with_readings')
      .select('*')
      .eq('building_id', buildingId)
      .eq('is_active', true)
  );
}

export async function loadOpenTasks(orgId) {
  return safeQuery(() =>
    supabase
      .from('v_open_tasks')
      .select('*')
      .eq('org_id', orgId)
      .order('priority', { ascending: false })
      .order('due_date')
  );
}

export async function loadOperatingCosts(buildingId) {
  return safeQuery(() =>
    supabase
      .from('v_operating_cost_summary')
      .select('*')
      .eq('building_id', buildingId)
      .order('period_start', { ascending: false })
  );
}

// Pricing-Funktionen (dynamisch)
export async function loadAppPricing(appId) {
  return safeQuery(() =>
    supabase
      .from('v_app_pricing')
      .select('*')
      .eq('app_id', appId)
      .eq('livemode', true)
      .order('sort_order')
  );
}

export async function loadCrossSellApps(appId) {
  return safeQuery(() =>
    supabase
      .from('v_fintutto_ecosystem')
      .select('*')
      .neq('app_id', appId)
      .order('sort_order')
  );
}