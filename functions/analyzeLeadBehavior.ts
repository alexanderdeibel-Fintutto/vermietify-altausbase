import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.Lead.list();
    const calculations = await base44.asServiceRole.entities.CalculationHistory.list();
    const quizResults = await base44.asServiceRole.entities.QuizResult.list();

    const analysis = {
      total_leads: leads.length,
      by_source: {},
      by_status: {},
      by_interest_level: {},
      avg_score: 0,
      conversion_funnel: {
        new: 0,
        contacted: 0,
        qualified: 0,
        trial_started: 0,
        converted: 0
      },
      engagement: {
        used_calculator: 0,
        completed_quiz: 0,
        generated_document: 0
      },
      top_performing_sources: []
    };

    // Aggregate data
    let totalScore = 0;
    leads.forEach(lead => {
      analysis.by_source[lead.source] = (analysis.by_source[lead.source] || 0) + 1;
      analysis.by_status[lead.status] = (analysis.by_status[lead.status] || 0) + 1;
      analysis.by_interest_level[lead.interest_level] = (analysis.by_interest_level[lead.interest_level] || 0) + 1;
      totalScore += lead.score;
      
      if (lead.status in analysis.conversion_funnel) {
        analysis.conversion_funnel[lead.status]++;
      }
    });

    analysis.avg_score = leads.length > 0 ? totalScore / leads.length : 0;

    // Engagement metrics
    const leadsWithCalculations = new Set(calculations.map(c => c.lead_id).filter(Boolean));
    const leadsWithQuiz = new Set(quizResults.map(q => q.lead_id).filter(Boolean));
    
    analysis.engagement.used_calculator = leadsWithCalculations.size;
    analysis.engagement.completed_quiz = leadsWithQuiz.size;

    // Top sources by conversion
    analysis.top_performing_sources = Object.entries(analysis.by_source)
      .map(([source, count]) => {
        const sourceLeads = leads.filter(l => l.source === source);
        const converted = sourceLeads.filter(l => l.status === 'converted').length;
        return {
          source,
          total: count,
          converted,
          conversion_rate: count > 0 ? (converted / count) * 100 : 0
        };
      })
      .sort((a, b) => b.conversion_rate - a.conversion_rate);

    return Response.json(analysis);
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});