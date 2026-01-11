import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id } = await req.json();

    const vacancies = await base44.asServiceRole.entities.Vacancy.filter({
      company_id,
      status: 'active'
    });

    const forecast = {
      total_vacancies: vacancies.length,
      total_lost_rent: 0,
      avg_duration_days: 0,
      by_reason: {}
    };

    let totalDays = 0;

    for (const vacancy of vacancies) {
      const start = new Date(vacancy.vacancy_start);
      const end = vacancy.vacancy_end ? new Date(vacancy.vacancy_end) : new Date();
      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));

      totalDays += days;
      forecast.total_lost_rent += vacancy.total_lost_rent || 0;

      if (!forecast.by_reason[vacancy.reason]) {
        forecast.by_reason[vacancy.reason] = { count: 0, total_lost: 0 };
      }
      forecast.by_reason[vacancy.reason].count++;
      forecast.by_reason[vacancy.reason].total_lost += vacancy.total_lost_rent || 0;
    }

    forecast.avg_duration_days = vacancies.length > 0 ? Math.round(totalDays / vacancies.length) : 0;

    return Response.json({ success: true, forecast });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});