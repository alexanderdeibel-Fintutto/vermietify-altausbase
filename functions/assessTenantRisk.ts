import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenant_id, credit_score, income_verification, background_check } = await req.json();

    let risk_score = 50;
    let risk_level = 'medium';

    // Credit score influence (max -40 points)
    if (credit_score) {
      if (credit_score >= 750) risk_score -= 30;
      else if (credit_score >= 700) risk_score -= 15;
      else if (credit_score < 620) risk_score += 20;
    }

    // Income verification (max -20 points)
    if (income_verification) risk_score -= 20;

    // Background check (max -10 points)
    if (background_check) risk_score -= 10;

    if (risk_score <= 30) risk_level = 'low';
    else if (risk_score >= 70) risk_level = 'high';

    const default_probability = Math.max(5, Math.min(95, risk_score));
    const recommendation = risk_level === 'low' ? 'approve' : risk_level === 'high' ? 'reject' : 'conditional';

    const report = await base44.entities.TenantVettingReport.create({
      tenant_id,
      credit_score: credit_score || 0,
      income_verification: income_verification || false,
      background_check: background_check || false,
      risk_level,
      risk_score,
      default_probability,
      recommendation
    });

    return Response.json({ success: true, report });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});