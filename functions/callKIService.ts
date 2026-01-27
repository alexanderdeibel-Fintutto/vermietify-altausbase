import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_ID = 'nk-abrechnung';
const KI_SERVICE_URL = 'https://aaefocdqgdgexkcrjhks.supabase.co/functions/v1/smart-function';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWZvY2RxZ2RnZXhrY3JqaGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjA0NzAsImV4cCI6MjA4NDMzNjQ3MH0.qsLTEZo7shbafWY9w4Fo7is9GDW-1Af1wup_iCy2vVQ';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, message, conversation_type, user_tier } = await req.json();

    if (!action) {
      return Response.json({ success: false, error: 'action erforderlich' }, { status: 400 });
    }

    const response = await fetch(KI_SERVICE_URL + '/' + action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ANON_KEY,
        'x-app-source': APP_ID,
        'x-user-id': user.id || '',
        'x-user-email': user.email || '',
        'x-user-tier': user_tier || 'free',
      },
      body: JSON.stringify({
        message: message,
        conversation_type: conversation_type || 'general'
      }),
    });

    const result = await response.json();
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});