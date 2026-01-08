import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id, auto_apply = false } = await req.json();

    if (!submission_id) {
      return Response.json({ error: 'submission_id required' }, { status: 400 });
    }

    console.log(`[AUTO-FIX] Analyzing ${submission_id}`);

    const submission = await base44.entities.ElsterSubmission.filter({ id: submission_id });
    
    if (submission.length === 0) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = submission[0];
    const formData = { ...sub.form_data } || {};
    const fixes = [];
    let applied = 0;

    // Fix 1: Negative Werte korrigieren
    Object.keys(formData).forEach(key => {
      const value = parseFloat(formData[key]);
      if (!isNaN(value) && value < 0 && !key.includes('verlust')) {
        fixes.push({
          field: key,
          old_value: value,
          new_value: Math.abs(value),
          reason: 'Negative Werte sollten positiv sein',
          auto_fixable: true
        });
        if (auto_apply) {
          formData[key] = Math.abs(value);
          applied++;
        }
      }
    });

    // Fix 2: Fehlende Pflichtfelder mit 0 initialisieren
    const requiredFields = ['einnahmen_gesamt', 'werbungskosten_gesamt', 'afa_betrag'];
    requiredFields.forEach(field => {
      if (!formData[field]) {
        fixes.push({
          field,
          old_value: null,
          new_value: 0,
          reason: 'Pflichtfeld fehlt, setze auf 0',
          auto_fixable: true
        });
        if (auto_apply) {
          formData[field] = 0;
          applied++;
        }
      }
    });

    // Fix 3: Ungültige Datumsformate
    Object.keys(formData).forEach(key => {
      if (key.includes('datum') && formData[key]) {
        const dateStr = String(formData[key]);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          fixes.push({
            field: key,
            old_value: dateStr,
            new_value: null,
            reason: 'Ungültiges Datumsformat - muss YYYY-MM-DD sein',
            auto_fixable: false
          });
        }
      }
    });

    // Wenn auto_apply, speichere die Änderungen
    if (auto_apply && applied > 0) {
      await base44.asServiceRole.entities.ElsterSubmission.update(submission_id, {
        form_data: formData
      });

      // Log
      await base44.asServiceRole.entities.ActivityLog.create({
        entity_type: 'ElsterSubmission',
        entity_id: submission_id,
        action: 'auto_fix_applied',
        user_id: user.id,
        metadata: {
          fixes_applied: applied,
          fixes_details: fixes.filter(f => f.auto_fixable)
        }
      });
    }

    console.log(`[AUTO-FIX] Found ${fixes.length} fixes, applied ${applied}`);

    return Response.json({
      success: true,
      fixes,
      applied_count: applied,
      total_fixes: fixes.length,
      recommendation: fixes.length > 0 
        ? 'Bitte prüfen Sie die vorgeschlagenen Korrekturen'
        : 'Keine automatischen Korrekturen nötig'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});