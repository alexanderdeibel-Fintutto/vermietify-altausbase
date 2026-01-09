import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, tenantContext, conversationHistory } = await req.json();

    if (!message) {
      return Response.json({ error: 'Missing message' }, { status: 400 });
    }

    // Fetch relevant FAQ articles
    const articles = await base44.asServiceRole.entities.KnowledgeBaseArticle.filter(
      { is_published: true },
      'order',
      100
    );

    // Find articles relevant to the user's message
    const relevantArticles = articles.filter(article =>
      article.content.toLowerCase().includes(message.toLowerCase()) ||
      article.tags?.some(tag => tag.toLowerCase().includes(message.toLowerCase()))
    ).slice(0, 3);

    const faqContext = relevantArticles.length > 0
      ? `Relevante FAQs:\n${relevantArticles.map(a => `- ${a.title}: ${a.content.substring(0, 100)}...`).join('\n')}`
      : '';

    const systemPrompt = `Du bist ein hilfreicher AI-Assistent für ein Immobilienverwaltungssystem. 
Du antwortest auf Fragen von Mietern zu ihren Mietverträgen, Zahlungen, Wartungsanfragen und allgemeinen Fragen.

Kontext des Mieters:
- Name: ${tenantContext?.tenant?.first_name} ${tenantContext?.tenant?.last_name}
- Miete: €${tenantContext?.activeContract?.monthly_rent}
- Vertragsstart: ${tenantContext?.activeContract?.start_date}
- Ausstehende Rechnungen: ${tenantContext?.recentInvoices?.filter(i => i.status !== 'paid').length || 0}

${faqContext}

Antworte kurz, hilfreich und freundlich auf Deutsch. 
- Nutze FAQ-Inhalte um Fragen zu beantworten
- Wenn die Frage außerhalb deines Kompetenzbereichs liegt, schlage vor, den Administrator zu kontaktieren
- Sei empathisch und professionell`;

    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Mieter' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nGesprächsverlauf:\n${conversationContext}\n\nNeue Frage: ${message}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
    });

    // Create insight record for frequently asked topics
    if (relevantArticles.length > 0) {
      await base44.asServiceRole.entities.AIInsight.create({
        insight_type: 'pattern_analysis',
        title: `Häufige Anfrage: ${relevantArticles[0].title}`,
        description: `Mieter fragte nach: ${message.substring(0, 100)}`,
        ai_analysis: JSON.stringify({
          matched_faq: relevantArticles.map(a => a.title),
          user_query: message,
        }),
        confidence_score: 75,
        priority: 'normal',
        generated_at: new Date().toISOString(),
      });
    }

    return Response.json({
      response: response,
      helpful_resources: relevantArticles.map(a => ({ title: a.title, id: a.id })),
    });
  } catch (error) {
    console.error('Enhanced AI Assistant error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});