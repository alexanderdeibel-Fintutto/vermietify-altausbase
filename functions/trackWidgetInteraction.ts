import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { widget_id, action, time_spent_seconds, engagement_score, relevance_score } = await req.json();

    if (!widget_id || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find or create interaction record
    const existing = await base44.entities.WidgetInteraction.filter({
      user_email: user.email,
      widget_id: widget_id,
      action: action
    });

    const now = new Date().toISOString();

    if (existing.length > 0) {
      // Update existing
      const record = existing[0];
      await base44.entities.WidgetInteraction.update(record.id, {
        interaction_count: (record.interaction_count || 1) + 1,
        last_interacted_at: now,
        time_spent_seconds: (record.time_spent_seconds || 0) + (time_spent_seconds || 0),
        engagement_score: engagement_score !== undefined ? engagement_score : record.engagement_score,
        relevance_score: relevance_score !== undefined ? relevance_score : record.relevance_score
      });
    } else {
      // Create new
      await base44.asServiceRole.entities.WidgetInteraction.create({
        user_email: user.email,
        widget_id,
        action,
        interaction_count: 1,
        last_interacted_at: now,
        time_spent_seconds: time_spent_seconds || 0,
        engagement_score: engagement_score || 0,
        relevance_score: relevance_score || 0
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});