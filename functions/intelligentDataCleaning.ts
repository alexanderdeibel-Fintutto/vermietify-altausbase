import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { submission_id, clean_type = 'auto' } = await req.json();

    console.log(`[DATA-CLEAN] Cleaning submission ${submission_id}`);

    const submissions = await base44.asServiceRole.entities.ElsterSubmission.filter({
      id: submission_id
    });

    if (submissions.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = submissions[0];
    const formData = submission.form_data || {};
    const cleaned = { ...formData };
    const changes = [];

    // Bereinige leere Strings
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === '' || cleaned[key] === null) {
        delete cleaned[key];
        changes.push(`Removed empty field: ${key}`);
      }
    });

    // Normalisiere Zahlen
    ['einnahmen_gesamt', 'werbungskosten_gesamt', 'afa_betrag'].forEach(field => {
      if (cleaned[field]) {
        const original = cleaned[field];
        cleaned[field] = parseFloat(String(cleaned[field]).replace(/[^\d.-]/g, ''));
        if (original !== cleaned[field]) {
          changes.push(`Normalized ${field}: ${original} → ${cleaned[field]}`);
        }
      }
    });

    // Entferne Duplikat-Felder
    const fieldCounts = {};
    Object.keys(cleaned).forEach(key => {
      const baseKey = key.replace(/\d+$/, '');
      fieldCounts[baseKey] = (fieldCounts[baseKey] || 0) + 1;
    });

    // Validiere Konsistenz
    if (cleaned.einnahmen_gesamt && cleaned.werbungskosten_gesamt) {
      const einkuenfte = cleaned.einnahmen_gesamt - cleaned.werbungskosten_gesamt;
      if (cleaned.einkuenfte && Math.abs(cleaned.einkuenfte - einkuenfte) > 1) {
        cleaned.einkuenfte = einkuenfte;
        changes.push(`Recalculated einkuenfte: ${einkuenfte}`);
      }
    }

    // Update Submission
    await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
      form_data: cleaned
    });

    // Log
    await base44.asServiceRole.entities.ActivityLog.create({
      entity_type: 'ElsterSubmission',
      entity_id: submission_id,
      action: 'data_cleaned',
      details: { changes },
      performed_by: user.email
    });

    console.log(`[DATA-CLEAN] Applied ${changes.length} changes`);

    return Response.json({
      success: true,
      changes_applied: changes.length,
      changes
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});