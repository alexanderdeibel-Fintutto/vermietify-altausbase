import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType } = await req.json();

    // Fetch data for analysis
    const entities = await base44.entities[entityType]?.list?.('-updated_date', 50) || [];

    // Generate recommendations
    const recommendations = [];

    if (entityType === 'Invoice') {
      const overdue = entities.filter(e => new Date(e.due_date) < new Date());
      if (overdue.length > 0) {
        recommendations.push({
          id: 'overdue-reminder',
          title: '⏰ Zahlungserinnerungen senden',
          description: `${overdue.length} Rechnungen sind fällig. Automatische Erinnerungen können Zahlungsquote um 30% erhöhen.`,
          impact: 'Hoch',
          action: 'send_reminders'
        });
      }

      const avgPaymentTime = entities.reduce((sum, e) => {
        const diff = new Date(e.payment_date || new Date()) - new Date(e.due_date);
        return sum + diff;
      }, 0) / entities.length;

      if (avgPaymentTime > 5 * 24 * 60 * 60 * 1000) {
        recommendations.push({
          id: 'payment-terms',
          title: '💳 Zahlungsbedingungen optimieren',
          description: 'Durchschnittliche Zahlungsverzögerung: 5+ Tage. Kürzere Zahlungsfristen erwägen.',
          impact: 'Mittel',
          action: 'optimize_terms'
        });
      }
    }

    // Generic recommendations
    if (entities.length < 10) {
      recommendations.push({
        id: 'data-volume',
        title: '📊 Datenerfassung erhöhen',
        description: 'Mehr Daten helfen bessere Vorhersagen zu treffen.',
        impact: 'Gering',
        action: 'import_data'
      });
    }

    return Response.json({
      data: recommendations.slice(0, 5)
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});