import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { company_id, query, filters = {}, limit = 50 } = await req.json();

    // Get all documents
    const docs = await base44.asServiceRole.entities.Document.filter({ company_id });

    // Full-text search
    const queryLower = query.toLowerCase();
    const searchResults = docs.filter(doc => 
      doc.name.toLowerCase().includes(queryLower) ||
      doc.content?.toLowerCase().includes(queryLower) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    );

    // Apply faceted filters
    let filtered = searchResults;

    if (filters.document_type) {
      filtered = filtered.filter(d => d.document_type === filters.document_type);
    }

    if (filters.date_from) {
      filtered = filtered.filter(d => new Date(d.created_date) >= new Date(filters.date_from));
    }

    if (filters.date_to) {
      filtered = filtered.filter(d => new Date(d.created_date) <= new Date(filters.date_to));
    }

    if (filters.tags?.length > 0) {
      filtered = filtered.filter(d =>
        filters.tags.some(tag => d.tags?.includes(tag))
      );
    }

    // Calculate facets
    const facets = {
      document_types: {},
      tags: {},
      date_ranges: {
        last_7_days: 0,
        last_30_days: 0,
        last_90_days: 0,
        older: 0
      }
    };

    const now = new Date();
    filtered.forEach(doc => {
      facets.document_types[doc.document_type] = (facets.document_types[doc.document_type] || 0) + 1;

      doc.tags?.forEach(tag => {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      });

      const daysOld = Math.floor((now - new Date(doc.created_date)) / (1000 * 60 * 60 * 24));
      if (daysOld <= 7) facets.date_ranges.last_7_days++;
      else if (daysOld <= 30) facets.date_ranges.last_30_days++;
      else if (daysOld <= 90) facets.date_ranges.last_90_days++;
      else facets.date_ranges.older++;
    });

    return Response.json({
      success: true,
      results: filtered.slice(0, limit),
      total: filtered.length,
      facets,
      query
    });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});