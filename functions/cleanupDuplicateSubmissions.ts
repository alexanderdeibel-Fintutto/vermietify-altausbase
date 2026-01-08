import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { dry_run = true } = await req.json();

    console.log(`[CLEANUP] Starting duplicate cleanup (dry_run: ${dry_run})`);

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.list();
    
    const duplicates = [];
    const seen = new Map();

    submissions.forEach(sub => {
      const key = `${sub.building_id}_${sub.tax_form_type}_${sub.tax_year}_${sub.legal_form}`;
      
      if (seen.has(key)) {
        duplicates.push({
          original: seen.get(key),
          duplicate: sub,
          key
        });
      } else {
        seen.set(key, sub);
      }
    });

    const results = { found: duplicates.length, deleted: 0 };

    if (!dry_run && duplicates.length > 0) {
      for (const dup of duplicates) {
        await base44.asServiceRole.entities.ElsterSubmission.delete(dup.duplicate.id);
        results.deleted++;
      }
    }

    console.log(`[CLEANUP] Found ${results.found}, deleted ${results.deleted}`);

    return Response.json({ success: true, results, duplicates: duplicates.slice(0, 10) });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});