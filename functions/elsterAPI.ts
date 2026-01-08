import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname.replace('/api/elster/', '');
    const base44 = createClientFromRequest(req);

    console.log(`[API] ${method} /${path}`);

    // GET /submissions - List all submissions
    if (path === 'submissions' && method === 'GET') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const submissions = await base44.entities.ElsterSubmission.list('-created_date');
      return Response.json({ data: submissions });
    }

    // GET /submissions/:id - Get specific submission
    if (path.startsWith('submissions/') && method === 'GET') {
      const submissionId = path.split('/')[1];
      const subs = await base44.entities.ElsterSubmission.filter({ id: submissionId });
      if (!subs?.length) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ data: subs[0] });
    }

    // POST /submissions - Create submission
    if (path === 'submissions' && method === 'POST') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

      const body = await req.json();
      const submission = await base44.entities.ElsterSubmission.create(body);
      return Response.json({ data: submission }, { status: 201 });
    }

    // POST /submissions/:id/submit - Submit to ELSTER
    if (path.includes('/submit') && method === 'POST') {
      const submissionId = path.split('/')[1];
      const response = await base44.functions.invoke('ericMicroserviceSubmit', {
        submission_id: submissionId,
        test_mode: true
      });
      return Response.json(response.data);
    }

    // GET /buildings/:id/analysis - Tax analysis for building
    if (path.includes('/analysis') && method === 'GET') {
      const buildingId = path.split('/')[1];
      const response = await base44.functions.invoke('suggestTaxOptimizations', {
        building_id: buildingId,
        tax_year: new Date().getFullYear() - 1
      });
      return Response.json(response.data);
    }

    return Response.json({ error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});