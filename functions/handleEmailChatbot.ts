import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email_subject, email_body, sender_email } = await req.json();

    if (!email_body || !sender_email) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Find FAQ articles related to the email content
    const articles = await base44.asServiceRole.entities.KnowledgeBaseArticle.filter(
      { is_published: true },
      'order',
      100
    );

    const relevantArticles = articles.filter(article =>
      article.content.toLowerCase().includes(email_body.toLowerCase().slice(0, 50)) ||
      article.title.toLowerCase().includes(email_subject?.toLowerCase() || '')
    ).slice(0, 3);

    const faqContext = relevantArticles.length > 0
      ? relevantArticles.map(a => `Q: ${a.title}\nA: ${a.content}`).join('\n\n')
      : 'Keine relevanten FAQs gefunden.';

    const prompt = `Du bist ein hilfreicher Email-Chatbot für ein Immobilienverwaltungssystem.
Antworte auf die folgende Email-Anfrage mit hilfreichen Informationen.

Relevante FAQs:
${faqContext}

Email-Betreff: ${email_subject || 'Keine Betreffzeile'}
Email-Text: ${email_body}

Gib eine hilfreiche, professionelle Antwort auf Deutsch aus, die:
1. Die Frage direkt beantwortet
2. Relevante FAQ-Inhalte einbezieht
3. Falls nötig, weitere Schritte vorschlägt
4. Höflich und sachlich ist

Antworte NUR mit der Email-Antwort, ohne Anführungszeichen oder Formatierung.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
    });

    // Log the email chatbot interaction
    await base44.asServiceRole.entities.TesterActivity.create({
      test_account_id: 'system',
      activity_type: 'email_chatbot_response',
      timestamp: new Date().toISOString(),
      metadata: {
        sender_email,
        subject: email_subject,
        response_generated: true,
        relevant_faqs: relevantArticles.length,
      },
    });

    return Response.json({
      response: response,
      relevant_faqs: relevantArticles.map(a => ({ id: a.id, title: a.title })),
      sender_email,
    });
  } catch (error) {
    console.error('Email chatbot error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});