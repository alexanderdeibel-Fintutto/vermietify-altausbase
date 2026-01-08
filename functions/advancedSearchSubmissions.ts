import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      query, 
      form_type, 
      status, 
      year_from, 
      year_to,
      building_id,
      has_errors,
      confidence_min,
      confidence_max
    } = await req.json();

    console.log('[SEARCH] Advanced search with filters');

    let filter = {};

    if (form_type) filter.tax_form_type = form_type;
    if (status) filter.status = status;
    if (building_id) filter.building_id = building_id;
    
    if (year_from || year_to) {
      filter.tax_year = {};
      if (year_from) filter.tax_year.$gte = year_from;
      if (year_to) filter.tax_year.$lte = year_to;
    }

    let submissions = await base44.entities.ElsterSubmission.filter(filter, '-created_date', 100);

    // Post-filter für komplexere Bedingungen
    if (has_errors !== undefined) {
      submissions = submissions.filter(s => 
        has_errors ? (s.validation_errors?.length > 0) : !(s.validation_errors?.length > 0)
      );
    }

    if (confidence_min !== undefined) {
      submissions = submissions.filter(s => 
        s.ai_confidence_score >= confidence_min
      );
    }

    if (confidence_max !== undefined) {
      submissions = submissions.filter(s => 
        s.ai_confidence_score <= confidence_max
      );
    }

    // Text-Suche
    if (query) {
      submissions = submissions.filter(s => 
        JSON.stringify(s).toLowerCase().includes(query.toLowerCase())
      );
    }

    return Response.json({ 
      success: true, 
      results: submissions,
      count: submissions.length 
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});