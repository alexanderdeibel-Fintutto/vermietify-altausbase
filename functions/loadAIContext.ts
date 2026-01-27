import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const APP_ID = 'nk-abrechnung';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role for reading from Supabase views
    const appContextData = await base44.asServiceRole.entities.AIAppContext?.list() || [];
    const personasData = await base44.asServiceRole.entities.AIPersonaContext?.list() || [];
    const promptsData = await base44.asServiceRole.entities.AISystemPrompts?.list() || [];

    // Filter app context for this app
    const appContext = appContextData.find(ctx => ctx.app_id === APP_ID);

    return Response.json({
      success: true,
      appContext: appContext || null,
      personas: personasData,
      systemPrompts: promptsData
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});