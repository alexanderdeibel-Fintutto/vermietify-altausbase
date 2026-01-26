/**
 * VERMIETIFY ZENTRALE API
 * 
 * Single Source of Truth für alle Datenzugriffe.
 * Supabase PostgreSQL ist die Datenbank.
 * Base44 Entities werden NICHT verwendet.
 */

import { supabase } from './supabaseClient.js';

const APP_ID = 'vermietify';

// ============================================================================
// BUILDINGS (Immobilien)
// ============================================================================

export async function loadBuildings() {
  try {
    const { data, error } = await supabase
      .from('v_buildings_summary')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading buildings:', error);
    return [];
  }
}

export async function loadBuildingDetail(buildingId) {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', buildingId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error loading building detail:', error);
    return null;
  }
}

// ============================================================================
// UNITS (Wohneinheiten)
// ============================================================================

export async function loadUnits(buildingId) {
  try {
    const { data, error } = await supabase
      .from('v_units_with_lease')
      .select('*')
      .eq('building_id', buildingId)
      .order('unit_number');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading units:', error);
    return [];
  }
}

// ============================================================================
// TENANTS (Mieter)
// ============================================================================

export async function loadTenants() {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('last_name, first_name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading tenants:', error);
    return [];
  }
}

// ============================================================================
// LEASE CONTRACTS (Mietverträge)
// ============================================================================

export async function loadActiveLeases(buildingId) {
  try {
    const { data, error } = await supabase
      .from('v_active_leases')
      .select('*')
      .eq('building_id', buildingId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading active leases:', error);
    return [];
  }
}

// ============================================================================
// METERS (Zähler)
// ============================================================================

export async function loadMetersWithReadings(buildingId) {
  try {
    const { data, error } = await supabase
      .from('v_meters_with_readings')
      .select('*')
      .eq('building_id', buildingId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading meters:', error);
    return [];
  }
}

export async function saveMeterReading(meterReading) {
  try {
    const { data, error } = await supabase
      .from('meter_readings')
      .insert([meterReading])
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error saving meter reading:', error);
    return null;
  }
}

// ============================================================================
// TASKS (Aufgaben)
// ============================================================================

export async function loadOpenTasks() {
  try {
    const { data, error } = await supabase
      .from('v_open_tasks')
      .select('*')
      .order('priority', { ascending: false })
      .order('due_date');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

// ============================================================================
// OPERATING COSTS (NK-Abrechnungen)
// ============================================================================

export async function loadOperatingCosts(buildingId) {
  try {
    const { data, error } = await supabase
      .from('v_operating_cost_summary')
      .select('*')
      .eq('building_id', buildingId)
      .order('period_start', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading operating costs:', error);
    return [];
  }
}

export async function loadOperatingCostStatement(buildingId, year) {
  try {
    const { data, error } = await supabase
      .from('operating_cost_statements')
      .select('*')
      .eq('building_id', buildingId)
      .eq('abrechnungsjahr', year)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error loading operating cost statement:', error);
    return null;
  }
}

export async function saveOperatingCostStatement(statement) {
  try {
    let result;
    
    if (statement.id) {
      const { data, error } = await supabase
        .from('operating_cost_statements')
        .update(statement)
        .eq('id', statement.id)
        .select();
      
      if (error) throw error;
      result = data?.[0];
    } else {
      const { data, error } = await supabase
        .from('operating_cost_statements')
        .insert([statement])
        .select();
      
      if (error) throw error;
      result = data?.[0];
    }
    
    return result || null;
  } catch (error) {
    console.error('Error saving operating cost statement:', error);
    return null;
  }
}

// ============================================================================
// PRICING (Dynamisch von Stripe laden)
// ============================================================================

export async function loadVermietifyPricing() {
  try {
    const { data, error } = await supabase
      .from('stripe_prices')
      .select('*, stripe_products(*)')
      .eq('stripe_products.app_id', APP_ID)
      .eq('active', true)
      .order('stripe_products(sort_order)');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading pricing:', error);
    return [];
  }
}

export async function loadCrossSellApps() {
  try {
    const { data, error } = await supabase
      .from('fintutto_apps')
      .select('*')
      .neq('app_id', APP_ID)
      .eq('active', true)
      .order('sort_order');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading cross-sell apps:', error);
    return [];
  }
}

// ============================================================================
// DOCUMENTS (Dokumente)
// ============================================================================

export async function loadDocuments(entityType, entityId) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

// ============================================================================
// PAYMENTS (Zahlungen)
// ============================================================================

export async function loadPayments(leaseId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', leaseId)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading payments:', error);
    return [];
  }
}