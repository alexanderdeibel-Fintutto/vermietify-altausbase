import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, correction_id, is_positive } = await req.json();

    // Log Feedback für ML-Verbesserung
    await base44.entities.ActivityLog.create({
      user_id: user.id,
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'correction_feedback',
      details: {
        correction_id,
        is_positive,
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({
      success: true,
      message: 'Feedback gespeichert'
    });

  } catch (error) {
    console.error('Log Correction Feedback Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});