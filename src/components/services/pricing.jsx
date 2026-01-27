import { supabase } from './supabaseClient';

const APP_ID = 'nk-abrechnung'; // FinTuttO NK-Abrechnung App ID

export async function getPricing() {
  try {
    const { data, error } = await supabase
      .from('v_app_pricing')
      .select('*')
      .eq('app_id', APP_ID)
      .eq('livemode', true)
      .order('sort_order');
    
    if (error) throw error;
    
    // Transform to expected format
    return (data || []).map(item => ({
      tier: item.tier_name,
      product_name: item.product_name,
      monthly_price: item.monthly_price,
      yearly_price: item.yearly_price,
      monthly_price_id: item.monthly_price_id,
      yearly_price_id: item.yearly_price_id,
      features: item.features || [],
      limits: {
        maxBuildings: item.max_buildings,
        maxUnits: item.max_units
      },
      is_popular: item.is_popular || false
    }));
  } catch (error) {
    console.error('Error loading pricing from v_app_pricing:', error);
    return [];
  }
}

export function formatPrice(price) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(price);
}

export function calculateYearlySavings(monthlyPrice, yearlyPrice) {
  if (!monthlyPrice || !yearlyPrice) return 0;
  const monthlyCost = monthlyPrice * 12;
  const savings = ((monthlyCost - yearlyPrice) / monthlyCost) * 100;
  return Math.round(savings);
}