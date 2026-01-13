import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { building_id, unit_id, current_rent } = await req.json();

    // Fetch market data (simplified - in production use real market API)
    const buildings = await base44.entities.Building.list();
    const building = buildings.find(b => b.id === building_id);
    
    const marketComparablePrice = building?.market_rent_per_sqm || 12;
    const unitSqm = 80; // Simplified - fetch from unit
    const marketPrice = marketComparablePrice * unitSqm;
    
    // Calculate legal max increase (Germany: 20% over 3 years or local limit)
    const legalMaxIncrease = current_rent * 1.2;
    const proposedRent = Math.min(marketPrice * 0.95, legalMaxIncrease);
    const increasePercentage = ((proposedRent - current_rent) / current_rent * 100).toFixed(1);

    // AI Recommendation
    let aiRecommendation = '';
    if (increasePercentage > 10) {
      aiRecommendation = '⚠️ Erhöhung >10% - Marktgründung wichtig';
    } else if (increasePercentage > 5) {
      aiRecommendation = '✓ Moderate Erhöhung - empfohlen';
    } else {
      aiRecommendation = '→ Minimale Erhöhung - Update im nächsten Jahr';
    }

    // Create proposal
    const proposal = await base44.entities.RentIncreaseProposal.create({
      building_id,
      unit_id,
      current_rent,
      proposed_rent: Math.round(proposedRent),
      increase_percentage: parseFloat(increasePercentage),
      market_comparable_price: marketPrice,
      legal_max_increase: Math.round(legalMaxIncrease),
      status: 'draft',
      ai_recommendation: aiRecommendation
    });

    return Response.json({ success: true, proposal });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});