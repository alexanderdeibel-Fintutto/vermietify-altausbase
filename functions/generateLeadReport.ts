import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.Lead.list();
    const quizResults = await base44.asServiceRole.entities.QuizResult.list();
    const calculations = await base44.asServiceRole.entities.CalculationHistory.list();

    // Statistics
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
    const convertedLeads = leads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Source distribution
    const sourceDistribution = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

    // Average score
    const avgScore = totalLeads > 0 
      ? leads.reduce((sum, l) => sum + l.score, 0) / totalLeads 
      : 0;

    // Hot leads (score >= 70)
    const hotLeads = leads.filter(l => l.score >= 70);

    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_leads: totalLeads,
        new_leads: newLeads,
        qualified_leads: qualifiedLeads,
        converted_leads: convertedLeads,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_score: Math.round(avgScore * 10) / 10,
        hot_leads_count: hotLeads.length
      },
      source_distribution: sourceDistribution,
      quiz_completions: quizResults.length,
      total_calculations: calculations.length,
      top_leads: hotLeads.slice(0, 10).map(l => ({
        email: l.email,
        name: l.name,
        score: l.score,
        source: l.source,
        status: l.status
      }))
    };

    return Response.json(report);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});