import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `Du bist ein hilfreicher Support-Assistent für eine Steuer- und Vermögensverwaltungs-App. Beantworte diese Frage kurz und präzise: ${message}`
  });

  return Response.json({ 
    user_message: message,
    bot_response: response,
    timestamp: new Date().toISOString()
  });
});