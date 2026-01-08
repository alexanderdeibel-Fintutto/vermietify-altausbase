import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[ROI] Calculating ELSTER integration ROI');

    const submissions = await base44.entities.ElsterSubmission.list();

    // Kosten-Schätzung
    const costs = {
      development: 0, // Einmalig
      maintenance_per_month: 50,
      per_submission: 2 // Zeit/Kosten pro Einreichung
    };

    const total_costs = costs.maintenance_per_month * 12 + (submissions.length * costs.per_submission);

    // Nutzen-Schätzung
    const benefits = {
      time_saved_per_submission: 60, // Minuten
      hourly_rate: 50, // EUR
      error_reduction: 0.8, // 80% weniger Fehler
      tax_optimization_savings: 500 // EUR pro Jahr pro Gebäude
    };

    const buildings_count = new Set(submissions.map(s => s.building_id).filter(Boolean)).size;
    const time_saved_hours = (submissions.length * benefits.time_saved_per_submission) / 60;
    const labor_savings = time_saved_hours * benefits.hourly_rate;
    const tax_savings = buildings_count * benefits.tax_optimization_savings;

    const total_benefits = labor_savings + tax_savings;
    const net_benefit = total_benefits - total_costs;
    const roi_percentage = total_costs > 0 ? ((net_benefit / total_costs) * 100) : 0;

    return Response.json({
      success: true,
      roi: {
        total_costs,
        total_benefits,
        net_benefit,
        roi_percentage: Math.round(roi_percentage),
        time_saved_hours: Math.round(time_saved_hours),
        submissions_processed: submissions.length,
        buildings_managed: buildings_count
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});