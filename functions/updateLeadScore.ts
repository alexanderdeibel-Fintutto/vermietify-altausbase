import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, score_delta, reason } = await req.json();

    if (!lead_id) {
      return Response.json({ error: 'Lead-ID erforderlich' }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    const newScore = Math.min(Math.max((lead.score || 0) + score_delta, 0), 100);

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      score: newScore,
      last_activity_at: new Date().toISOString()
    });

    return Response.json({ success: true, new_score: newScore });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});