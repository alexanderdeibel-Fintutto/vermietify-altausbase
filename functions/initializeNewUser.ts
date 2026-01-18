import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create welcome notification
    await base44.asServiceRole.entities.Notification.create({
      title: 'Willkommen bei Vermitify!',
      message: 'Starten Sie mit unserem Onboarding-Wizard, um Ihre erste Immobilie anzulegen.',
      type: 'info',
      recipient_email: user.email,
      is_read: false
    });

    // Track user initialization
    await base44.analytics.track({
      eventName: 'user_initialized',
      properties: {
        user_email: user.email,
        signup_date: new Date().toISOString()
      }
    });

    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});