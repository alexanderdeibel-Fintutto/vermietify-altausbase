import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { building_id, month, expected_income, actual_income } = await req.json();

    const variance = actual_income - expected_income;
    const variancePercentage = expected_income > 0 ? (variance / expected_income) * 100 : 0;

    let varianceType = 'on_target';
    if (Math.abs(variancePercentage) > 5) {
      varianceType = variance > 0 ? 'overperformance' : 'underperformance';
    }

    const building = await base44.asServiceRole.entities.Building.read(building_id);

    const incomeVariance = await base44.asServiceRole.entities.IncomeVariance.create({
      building_id,
      company_id: building.company_id,
      month,
      expected_income,
      actual_income,
      variance: Math.round(variance * 100) / 100,
      variance_percentage: Math.round(variancePercentage * 100) / 100,
      variance_type
    });

    // Send alert if significant underperformance
    if (varianceType === 'underperformance' && Math.abs(variancePercentage) > 10) {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: '⚠️ Mindereinnahmen erkannt',
        body: `Objekt ${building.name} hat ${Math.abs(variancePercentage).toFixed(1)}% Mindereinnahmen im ${month}.

Erwartet: ${expected_income}€
Tatsächlich: ${actual_income}€
Differenz: ${variance}€`
      });
    }

    return Response.json({ success: true, variance: incomeVariance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});