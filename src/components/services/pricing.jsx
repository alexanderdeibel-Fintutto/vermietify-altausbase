import { base44 } from '@/api/base44Client';

export async function getPricing() {
  try {
    const pricing = await base44.entities.SubscriptionPlan.list();
    
    // Transform to pricing format
    return pricing.map(plan => ({
      tier: plan.internal_code,
      product_name: plan.name,
      monthly_price: plan.price_monthly,
      yearly_price: plan.price_yearly,
      monthly_price_id: plan.stripe_price_id_monthly,
      yearly_price_id: plan.stripe_price_id_yearly,
      features: plan.features ? JSON.parse(plan.features) : [],
      limits: {
        maxBuildings: plan.max_buildings === -1 ? null : plan.max_buildings,
        maxUnits: plan.max_units === -1 ? null : plan.max_units
      },
      is_popular: plan.display_order === 2
    })).sort((a, b) => a.display_order - b.display_order);
  } catch (error) {
    console.error('Error loading pricing:', error);
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