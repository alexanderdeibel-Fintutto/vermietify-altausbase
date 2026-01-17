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
    const { event_type, lead_id, properties = {} } = body;

    // Track analytics
    await base44.analytics.track({
      eventName: event_type,
      properties
    });

    // Update lead score if lead_id provided
    if (lead_id) {
      const scoreMap = {
        'calculator_used': 5,
        'quiz_completed': 15,
        'document_generated': 10,
        'pdf_downloaded': 8,
        'email_shared': 7,
        'pricing_viewed': 10,
        'signup_started': 20
      };

      const scoreIncrease = scoreMap[event_type] || 1;

      const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
      const newScore = Math.min(lead.score + scoreIncrease, 100);

      let interestLevel = 'cold';
      if (newScore >= 70) interestLevel = 'hot';
      else if (newScore >= 40) interestLevel = 'warm';

      await base44.asServiceRole.entities.Lead.update(lead_id, {
        score: newScore,
        interest_level: interestLevel,
        last_activity_at: new Date().toISOString()
      });

      return Response.json({ 
        success: true, 
        new_score: newScore 
      }, { headers: corsHeaders });
    }

    return Response.json({ success: true }, { headers: corsHeaders });
    
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
});