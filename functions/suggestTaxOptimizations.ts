import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[TAX-OPTIMIZATION] Analyzing ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const formData = sub.form_data || {};

    const optimizations = [];

    // Analysiere Werbungskosten
    const werbungskosten = parseFloat(formData.werbungskosten_gesamt || 0);
    const einnahmen = parseFloat(formData.einnahmen_gesamt || 0);

    if (werbungskosten < einnahmen * 0.3) {
      optimizations.push({
        category: 'Werbungskosten',
        suggestion: 'Ihre Werbungskosten erscheinen niedrig. Prüfen Sie ob alle absetzbaren Kosten erfasst wurden.',
        potential_saving: Math.round((einnahmen * 0.3 - werbungskosten) * 0.25),
        priority: 'HIGH',
        details: [
          'Reparatur- und Instandhaltungskosten',
          'Versicherungen',
          'Grundsteuer',
          'Hausnebenkosten',
          'Finanzierungszinsen'
        ]
      });
    }

    // AfA-Prüfung
    if (!formData.afa_betrag || parseFloat(formData.afa_betrag) === 0) {
      optimizations.push({
        category: 'AfA',
        suggestion: 'Keine AfA erfasst. Prüfen Sie ob Abschreibungen möglich sind.',
        potential_saving: 2000,
        priority: 'HIGH',
        details: [
          'Gebäude-AfA (2% linear)',
          'Außenanlagen-AfA',
          'Einbauten separat abschreibbar'
        ]
      });
    }

    // Erhaltungsaufwand
    const erhaltungsaufwand = parseFloat(formData.erhaltungsaufwand || 0);
    if (erhaltungsaufwand > einnahmen * 0.15) {
      optimizations.push({
        category: 'Erhaltungsaufwand',
        suggestion: 'Hoher Erhaltungsaufwand. Prüfen Sie die 15%-Regelung und verteilte Abschreibung.',
        potential_saving: 0,
        priority: 'MEDIUM',
        details: [
          'Bei > 15% der Gebäude-HK über 5 Jahre verteilen',
          'Anschaffungsnahe Herstellungskosten prüfen',
          'Erhaltung vs. Modernisierung abgrenzen'
        ]
      });
    }

    // Zinsen
    if (!formData.schuldzinsen || parseFloat(formData.schuldzinsen) === 0) {
      optimizations.push({
        category: 'Finanzierungskosten',
        suggestion: 'Keine Schuldzinsen erfasst. Bei Finanzierung sind diese absetzbar.',
        potential_saving: 1000,
        priority: 'MEDIUM',
        details: [
          'Darlehenszinsen',
          'Finanzierungsnebenkosten',
          'Disagio verteilt absetzbar'
        ]
      });
    }

    console.log(`[TAX-OPTIMIZATION] Found ${optimizations.length} optimization opportunities`);

    return Response.json({
      success: true,
      optimizations,
      total_potential_saving: optimizations.reduce((sum, opt) => sum + opt.potential_saving, 0)
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});