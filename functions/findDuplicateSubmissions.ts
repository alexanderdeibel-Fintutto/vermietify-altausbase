import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DUPLICATE-CHECK] Scanning for duplicates...');

    const submissions = await base44.entities.ElsterSubmission.list('-created_date');

    const duplicates = [];
    const seen = new Map();

    submissions.forEach(sub => {
      const key = `${sub.building_id}-${sub.tax_form_type}-${sub.tax_year}`;
      
      if (seen.has(key)) {
        const existing = seen.get(key);
        duplicates.push({
          group_key: key,
          submissions: [existing, sub],
          building_id: sub.building_id,
          form_type: sub.tax_form_type,
          tax_year: sub.tax_year
        });
      } else {
        seen.set(key, sub);
      }
    });

    console.log(`[DUPLICATE-CHECK] Found ${duplicates.length} potential duplicates`);

    return Response.json({
      success: true,
      duplicates,
      duplicate_count: duplicates.length,
      recommendations: duplicates.length > 0 
        ? 'Bitte prüfen Sie die Duplikate und löschen/archivieren Sie die älteren Versionen.'
        : 'Keine Duplikate gefunden.'
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});