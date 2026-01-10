import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subscription } = await req.json();

  const prefs = await base44.entities.NotificationPreference.filter({ user_email: user.email });
  if (prefs.length > 0) {
    await base44.entities.NotificationPreference.update(prefs[0].id, {
      push_enabled: true,
      push_subscription: subscription
    });
  } else {
    await base44.entities.NotificationPreference.create({
      user_email: user.email,
      push_enabled: true,
      push_subscription: subscription
    });
  }

  return Response.json({ success: true });
});