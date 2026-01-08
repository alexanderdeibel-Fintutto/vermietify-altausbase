import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_form_type, tax_year } = await req.json();

    console.log(`[CHECK] Duplicate check: ${tax_form_type} ${tax_year} for building ${building_id}`);

    const existingSubmissions = await base44.entities.ElsterSubmission.filter({
      building_id,
      tax_form_type,
      tax_year
    });

    if (existingSubmissions.length === 0) {
      return Response.json({
        has_duplicate: false,
        message: 'Keine Duplikate gefunden'
      });
    }

    const activeSubmissions = existingSubmissions.filter(s => 
      s.status !== 'REJECTED' && s.status !== 'DRAFT'
    );

    if (activeSubmissions.length > 0) {
      const latest = activeSubmissions.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      )[0];

      return Response.json({
        has_duplicate: true,
        duplicate_count: activeSubmissions.length,
        latest_submission: {
          id: latest.id,
          status: latest.status,
          created_date: latest.created_date,
          submission_date: latest.submission_date
        },
        warning_level: latest.status === 'ACCEPTED' ? 'critical' : 'warning',
        message: latest.status === 'ACCEPTED' 
          ? `Es existiert bereits eine akzeptierte ${tax_form_type} für ${tax_year}. Eine erneute Übermittlung kann zu Problemen führen.`
          : `Es existiert bereits eine ${tax_form_type} für ${tax_year} mit Status ${latest.status}.`
      });
    }

    return Response.json({
      has_duplicate: false,
      message: 'Nur Entwürfe gefunden, fortfahren möglich'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});