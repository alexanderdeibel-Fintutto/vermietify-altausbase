import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cache_type = 'all', ttl = 3600 } = await req.json();

    console.log('[CACHE] Building cache for type:', cache_type);

    const cacheData = {};
    const timestamp = new Date().toISOString();

    if (cache_type === 'submissions' || cache_type === 'all') {
      cacheData.submissions = await base44.entities.ElsterSubmission.list('-created_date', 500);
      cacheData.submissionsByStatus = {};
      cacheData.submissions.forEach(sub => {
        if (!cacheData.submissionsByStatus[sub.status]) {
          cacheData.submissionsByStatus[sub.status] = [];
        }
        cacheData.submissionsByStatus[sub.status].push(sub);
      });
    }

    if (cache_type === 'buildings' || cache_type === 'all') {
      cacheData.buildings = await base44.entities.Building.list();
    }

    if (cache_type === 'certificates' || cache_type === 'all') {
      cacheData.certificates = await base44.entities.ElsterCertificate.list();
    }

    if (cache_type === 'categories' || cache_type === 'all') {
      cacheData.taxCategories = await base44.entities.TaxCategoryMaster.list();
    }

    return Response.json({
      success: true,
      cached_at: timestamp,
      expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
      cache_size: Object.keys(cacheData).length,
      data: cacheData
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});