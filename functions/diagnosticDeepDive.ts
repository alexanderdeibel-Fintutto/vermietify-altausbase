import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const subs = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    if (subs.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const sub = subs[0];
    const diagnostics = {
      data_completeness: {},
      consistency_checks: {},
      performance_metrics: {},
      recommendations: []
    };

    // Daten-Vollständigkeit
    const requiredFields = ['finanzamt', 'steuernummer', 'einnahmen_gesamt'];
    const fieldCount = Object.keys(sub.form_data || {}).length;
    diagnostics.data_completeness = {
      total_fields: fieldCount,
      required_present: requiredFields.filter(f => sub.form_data?.[f]).length,
      required_total: requiredFields.length,
      percentage: fieldCount > 0 ? Math.round((fieldCount / 20) * 100) : 0
    };

    // Konsistenz-Checks
    if (sub.form_data) {
      const einnahmen = parseFloat(sub.form_data.einnahmen_gesamt || 0);
      const ausgaben = parseFloat(sub.form_data.werbungskosten_gesamt || 0);
      
      diagnostics.consistency_checks = {
        einnahmen_valid: einnahmen > 0,
        ausgaben_plausible: ausgaben <= einnahmen * 2,
        nettoertrag: einnahmen - ausgaben
      };

      if (ausgaben > einnahmen * 1.5) {
        diagnostics.recommendations.push('Ausgaben sind ungewöhnlich hoch - prüfen Sie die Beträge');
      }
    }

    // Performance
    const activities = await base44.entities.ActivityLog.filter({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id
    });

    diagnostics.performance_metrics = {
      total_changes: activities.length,
      avg_change_time: activities.length > 1 ? 
        (new Date(activities[activities.length - 1].created_date) - new Date(activities[0].created_date)) / (activities.length - 1) / 1000 : 0
    };

    return Response.json({ success: true, diagnostics });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});