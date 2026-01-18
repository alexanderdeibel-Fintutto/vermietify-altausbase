import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const base44 = createClientFromRequest(req);

  try {
    const { quiz_type, answers, lead_id, duration_seconds } = await req.json();

    if (!quiz_type || !answers) {
      return Response.json({ success: false, error: 'Quiz-Typ und Antworten erforderlich' }, { status: 400, headers: corsHeaders });
    }

    const { score, maxScore, category, recommendations } = evaluateQuiz(quiz_type, answers);

    const result = await base44.asServiceRole.entities.QuizResult.create({
      lead_id: lead_id || null,
      quiz_type,
      answers: JSON.stringify(answers),
      score,
      max_score: maxScore,
      result_category: category,
      recommendations: JSON.stringify(recommendations),
      completed: true,
      duration_seconds: duration_seconds || null
    });

    if (lead_id) {
      const existingLead = await base44.asServiceRole.entities.Lead.get(lead_id);
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        score: Math.min(existingLead.score + 15, 100),
        last_activity_at: new Date().toISOString()
      });
    }

    return Response.json({ 
      success: true, 
      result_id: result.id, 
      score, 
      max_score: maxScore, 
      category, 
      recommendations 
    }, { headers: corsHeaders });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
});

function evaluateQuiz(type, answers) {
  const answerArray = Array.isArray(answers) ? answers : Object.values(answers);
  let score = 0;
  const maxScore = answerArray.length * 10;

  answerArray.forEach(answer => {
    if (typeof answer === 'object' && answer.score) {
      score += answer.score;
    } else if (typeof answer === 'number') {
      score += answer;
    }
  });

  const percentage = (score / maxScore) * 100;
  const category = percentage >= 80 ? 'Profi' : percentage >= 50 ? 'Fortgeschritten' : 'Einsteiger';
  
  const recommendations = [];
  if (percentage < 50) {
    recommendations.push('Steuerberatung empfohlen', 'Grundlagen-Kurs ansehen');
  } else if (percentage < 80) {
    recommendations.push('Premium-Features nutzen', 'Weiterbildung empfohlen');
  } else {
    recommendations.push('Expertenmodus aktivieren', 'Alle Features verfügbar');
  }

  return { score, maxScore, category, recommendations };
}