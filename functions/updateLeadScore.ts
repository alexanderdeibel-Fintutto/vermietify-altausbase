import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { lead_id, activity_type } = body;
    
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    
    let scoreIncrease = 0;
    
    switch (activity_type) {
      case 'calculation':
        scoreIncrease = 5;
        break;
      case 'quiz_completed':
        scoreIncrease = 15;
        break;
      case 'document_generated':
        scoreIncrease = 10;
        break;
      case 'email_opened':
        scoreIncrease = 2;
        break;
      case 'link_clicked':
        scoreIncrease = 3;
        break;
      default:
        scoreIncrease = 1;
    }
    
    const newScore = Math.min(lead.score + scoreIncrease, 100);
    
    // Update interest level based on score
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
      new_score: newScore,
      interest_level: interestLevel 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});