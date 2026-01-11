import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await req.json();

    if (action === 'suggestResponse') {
      const { messageId, messageContent } = data;

      // Nutze InvokeLLM um Response-Vorschläge zu generieren
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein professioneller Kundenservice-Agent für eine Immobilienverwaltung. 
        
Mieter-Nachricht: "${messageContent}"

Generiere 3 kurze, höfliche und professionelle Response-Vorschläge auf Deutsch (jeweils max 100 Wörter).
Antworte nur mit den 3 Vorschlägen, nummeriert.`,
        add_context_from_internet: false,
      });

      // Parse responses
      const suggestions = response.split('\n').filter(line => line.trim().match(/^\d\./)).map(line => line.replace(/^\d\.\s*/, ''));

      return Response.json({
        success: true,
        suggestions: suggestions.slice(0, 3),
      });
    }

    if (action === 'generateAutoMessage') {
      const { tenant, messageType } = data;

      const templates = {
        payment_reminder: `Sehr geehrte(r) ${tenant.first_name} ${tenant.last_name},\n\nwir erinnern Sie höflich daran, dass Ihre Mietzahlung fällig ist. Bitte überweisen Sie den Betrag bis spätestens zum 5. des Monats.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`,
        maintenance_notice: `Sehr geehrte(r) ${tenant.first_name} ${tenant.last_name},\n\nwir möchten Sie über anstehende Wartungsarbeiten in Ihrem Gebäude informieren. Der Termin wird in den nächsten Tagen festgelegt.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`,
        announcement: `Sehr geehrte(r) ${tenant.first_name} ${tenant.last_name},\n\nwichtige Mitteilung für alle Bewohner: Das Treppenhaus wird vom 15.-17. Januar gereinigt und renoviert.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`,
      };

      const message = templates[messageType] || templates.announcement;

      return Response.json({
        success: true,
        message,
        type: messageType,
      });
    }

    if (action === 'prioritizeMessages') {
      const { messages } = data;

      // Simple prioritization based on keywords
      const priorityKeywords = {
        high: ['notfall', 'dringend', 'sofort', 'schaden', 'leck', 'strom'],
        medium: ['wartung', 'reparatur', 'besichtigung'],
        low: ['anfrage', 'information', 'sonstiges'],
      };

      const prioritized = messages.map(msg => {
        let priority = 'low';
        const content = (msg.message || '').toLowerCase();

        if (priorityKeywords.high.some(kw => content.includes(kw))) {
          priority = 'high';
        } else if (priorityKeywords.medium.some(kw => content.includes(kw))) {
          priority = 'medium';
        }

        return { ...msg, priority, suggestedResponse: null };
      }).sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      });

      return Response.json({
        success: true,
        messages: prioritized,
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI Communication error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});