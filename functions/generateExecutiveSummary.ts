import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await req.json();

    console.log(`[EXECUTIVE] Generating summary for ${year}`);

    const submissions = await base44.entities.ElsterSubmission.filter({ tax_year: year });

    const summary = {
      year,
      overview: {},
      financial_summary: {},
      status_breakdown: {},
      key_metrics: {},
      action_items: []
    };

    // Overview
    summary.overview = {
      total_submissions: submissions.length,
      total_buildings: new Set(submissions.map(s => s.building_id).filter(Boolean)).size,
      completed: submissions.filter(s => s.status === 'ACCEPTED').length,
      pending: submissions.filter(s => s.status === 'DRAFT').length
    };

    // Financial Summary
    const totalEinnahmen = submissions.reduce((sum, s) => sum + (parseFloat(s.form_data?.einnahmen_gesamt) || 0), 0);
    const totalAusgaben = submissions.reduce((sum, s) => sum + (parseFloat(s.form_data?.werbungskosten_gesamt) || 0), 0);

    summary.financial_summary = {
      total_einnahmen: Math.round(totalEinnahmen),
      total_ausgaben: Math.round(totalAusgaben),
      nettoertrag: Math.round(totalEinnahmen - totalAusgaben),
      avg_per_building: summary.overview.total_buildings > 0 ? 
        Math.round(totalEinnahmen / summary.overview.total_buildings) : 0
    };

    // Status Breakdown
    summary.status_breakdown = {
      DRAFT: submissions.filter(s => s.status === 'DRAFT').length,
      VALIDATED: submissions.filter(s => s.status === 'VALIDATED').length,
      SUBMITTED: submissions.filter(s => s.status === 'SUBMITTED').length,
      ACCEPTED: submissions.filter(s => s.status === 'ACCEPTED').length,
      REJECTED: submissions.filter(s => s.status === 'REJECTED').length
    };

    // Action Items
    if (summary.overview.pending > 0) {
      summary.action_items.push(`${summary.overview.pending} Submissions benötigen Bearbeitung`);
    }
    if (submissions.filter(s => s.validation_errors?.length > 0).length > 0) {
      summary.action_items.push('Validierungsfehler beheben');
    }

    return Response.json({ success: true, summary });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});