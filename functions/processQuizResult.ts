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
    const body = await req.json();
    
    const {
      quiz_type,
      answers,
      lead_id,
      duration_seconds
    } = body;
    
    if (!quiz_type || !answers) {
      return Response.json(
        { success: false, error: 'Quiz-Typ und Antworten erforderlich' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Evaluate quiz
    const evaluation = evaluateQuiz(quiz_type, answers);
    
    // Save quiz result
    const result = await base44.asServiceRole.entities.QuizResult.create({
      lead_id: lead_id || null,
      quiz_type,
      answers,
      score: evaluation.score,
      max_score: evaluation.maxScore,
      result_category: evaluation.category,
      recommendations: evaluation.recommendations,
      completed: true,
      duration_seconds: duration_seconds || null
    });
    
    // Update lead score if lead exists
    if (lead_id) {
      const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
      const newScore = Math.min(lead.score + 15, 100);
      
      await base44.asServiceRole.entities.Lead.update(lead_id, {
        score: newScore,
        last_activity_at: new Date().toISOString()
      });
    }
    
    return Response.json({
      success: true,
      result_id: result.id,
      score: evaluation.score,
      max_score: evaluation.maxScore,
      category: evaluation.category,
      recommendations: evaluation.recommendations
    }, { headers: corsHeaders });
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message }, 
      { status: 500, headers: corsHeaders }
    );
  }
});

function evaluateQuiz(type, answers) {
  let score = 0;
  const answerArray = Object.values(answers);
  const maxScore = answerArray.length * 10;
  
  answerArray.forEach(answer => {
    if (typeof answer === 'object' && answer.score) {
      score += answer.score;
    } else if (typeof answer === 'number') {
      score += answer;
    } else {
      score += 5; // Default score for any answer
    }
  });
  
  const percentage = (score / maxScore) * 100;
  
  let category = 'Einsteiger';
  if (percentage >= 80) category = 'Profi';
  else if (percentage >= 50) category = 'Fortgeschritten';
  
  let recommendations = [];
  if (percentage < 50) {
    recommendations = [
      'Steuerberatung empfohlen',
      'Grundlagen-Kurs zur Immobilienverwaltung',
      'Nutzung von Vorlagen für Dokumente'
    ];
  } else if (percentage < 80) {
    recommendations = [
      'Betriebskostenabrechnung optimieren',
      'Steueroptimierung durch Anlage V',
      'Digitalisierung der Prozesse'
    ];
  } else {
    recommendations = [
      'Premium-Features nutzen',
      'Portfolio-Analysen durchführen',
      'Automatisierungen einrichten'
    ];
  }
  
  return {
    score,
    maxScore,
    category,
    recommendations
  };
}