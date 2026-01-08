import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filters } = await req.json();

    console.log('[FILTER] Advanced filtering with:', filters);

    let submissions = await base44.entities.ElsterSubmission.list('-created_date', 500);

    // Apply filters
    if (filters.form_types?.length > 0) {
      submissions = submissions.filter(s => filters.form_types.includes(s.tax_form_type));
    }

    if (filters.statuses?.length > 0) {
      submissions = submissions.filter(s => filters.statuses.includes(s.status));
    }

    if (filters.year_from) {
      submissions = submissions.filter(s => s.tax_year >= filters.year_from);
    }

    if (filters.year_to) {
      submissions = submissions.filter(s => s.tax_year <= filters.year_to);
    }

    if (filters.building_ids?.length > 0) {
      submissions = submissions.filter(s => filters.building_ids.includes(s.building_id));
    }

    if (filters.has_errors === true) {
      submissions = submissions.filter(s => s.validation_errors?.length > 0);
    } else if (filters.has_errors === false) {
      submissions = submissions.filter(s => !s.validation_errors?.length);
    }

    if (filters.confidence_min) {
      submissions = submissions.filter(s => s.ai_confidence_score >= filters.confidence_min);
    }

    if (filters.confidence_max) {
      submissions = submissions.filter(s => s.ai_confidence_score <= filters.confidence_max);
    }

    if (filters.created_after) {
      const date = new Date(filters.created_after);
      submissions = submissions.filter(s => new Date(s.created_date) >= date);
    }

    if (filters.created_before) {
      const date = new Date(filters.created_before);
      submissions = submissions.filter(s => new Date(s.created_date) <= date);
    }

    return Response.json({ 
      success: true, 
      submissions,
      count: submissions.length,
      filters_applied: Object.keys(filters).length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});