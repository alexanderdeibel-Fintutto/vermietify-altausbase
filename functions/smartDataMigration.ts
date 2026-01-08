import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { operation, params } = await req.json();

    console.log(`[MIGRATION] Running: ${operation}`);

    const result = { migrated: 0, errors: [] };

    switch (operation) {
      case 'fix_missing_fields':
        const subs = await base44.asServiceRole.entities.ElsterSubmission.list();
        for (const sub of subs) {
          let needsUpdate = false;
          const updates = {};

          if (!sub.submission_mode) {
            updates.submission_mode = 'TEST';
            needsUpdate = true;
          }

          if (!sub.legal_form && sub.building_id) {
            updates.legal_form = 'PRIVATPERSON';
            needsUpdate = true;
          }

          if (needsUpdate) {
            await base44.asServiceRole.entities.ElsterSubmission.update(sub.id, updates);
            result.migrated++;
          }
        }
        break;

      case 'normalize_form_data':
        const allSubs = await base44.asServiceRole.entities.ElsterSubmission.list();
        for (const sub of allSubs) {
          if (sub.form_data) {
            const normalized = {};
            Object.keys(sub.form_data).forEach(key => {
              const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
              normalized[cleanKey] = sub.form_data[key];
            });
            await base44.asServiceRole.entities.ElsterSubmission.update(sub.id, { form_data: normalized });
            result.migrated++;
          }
        }
        break;

      default:
        return Response.json({ error: 'Unknown operation' }, { status: 400 });
    }

    return Response.json({ success: true, result });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});