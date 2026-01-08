import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('[REGRESSION] Running automated tests');

    const results = { total: 0, passed: 0, failed: 0, tests: [] };

    // Test 1: Validate alle ACCEPTED Submissions
    const accepted = await base44.asServiceRole.entities.ElsterSubmission.filter({ status: 'ACCEPTED' });
    for (const sub of accepted.slice(0, 10)) {
      results.total++;
      try {
        const valid = sub.xml_data && sub.form_data && sub.elster_response;
        if (valid) {
          results.passed++;
          results.tests.push({ name: `Validate ${sub.id}`, status: 'passed' });
        } else {
          results.failed++;
          results.tests.push({ name: `Validate ${sub.id}`, status: 'failed', error: 'Missing data' });
        }
      } catch (error) {
        results.failed++;
        results.tests.push({ name: `Validate ${sub.id}`, status: 'failed', error: error.message });
      }
    }

    // Test 2: Prüfe Datenkonsistenz
    results.total++;
    const allSubs = await base44.asServiceRole.entities.ElsterSubmission.list('-created_date', 100);
    const consistent = allSubs.every(s => s.tax_year && s.tax_form_type && s.status);
    if (consistent) {
      results.passed++;
      results.tests.push({ name: 'Data consistency', status: 'passed' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Data consistency', status: 'failed' });
    }

    return Response.json({ success: true, results });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});