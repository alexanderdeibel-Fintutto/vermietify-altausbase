import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      query, 
      company_id, 
      filters = {},
      limit = 50,
      offset = 0
    } = await req.json();

    // Fetch all documents for the company
    const allDocuments = await base44.asServiceRole.entities.Document.filter({
      company_id
    });

    // Fetch analyses for full-text search
    const analyses = await base44.asServiceRole.entities.DocumentAnalysis.filter({
      building_id: company_id
    });

    // Create analysis lookup map
    const analysisMap = {};
    analyses.forEach(a => {
      analysisMap[a.document_url] = a;
    });

    // Filter and score results
    let results = allDocuments.map(doc => {
      const analysis = analysisMap[doc.url];
      let relevanceScore = 0;
      const matchedFields = [];

      // Exact name match (highest priority)
      if (doc.name && doc.name.toLowerCase() === query.toLowerCase()) {
        relevanceScore += 100;
        matchedFields.push('name');
      }
      // Name contains query
      else if (doc.name && doc.name.toLowerCase().includes(query.toLowerCase())) {
        relevanceScore += 50;
        matchedFields.push('name');
      }

      // Full-text search in extracted content
      if (analysis?.extracted_data) {
        const contentStr = JSON.stringify(analysis.extracted_data).toLowerCase();
        if (contentStr.includes(query.toLowerCase())) {
          relevanceScore += 30;
          matchedFields.push('content');
        }
      }

      // Search in summary
      if (analysis?.extracted_data?.summary) {
        if (analysis.extracted_data.summary.toLowerCase().includes(query.toLowerCase())) {
          relevanceScore += 20;
          matchedFields.push('summary');
        }
      }

      // Tag search
      if (doc.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))) {
        relevanceScore += 15;
        matchedFields.push('tags');
      }

      // Category search
      if (analysis?.category && analysis.category.toLowerCase().includes(query.toLowerCase())) {
        relevanceScore += 10;
        matchedFields.push('category');
      }

      return {
        ...doc,
        analysis,
        relevanceScore,
        matchedFields
      };
    });

    // Apply metadata filters
    if (filters.document_type) {
      results = results.filter(d => d.type === filters.document_type);
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      results = results.filter(d => new Date(d.created_date) >= fromDate);
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      results = results.filter(d => new Date(d.created_date) <= toDate);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(d => 
        filters.tags.some(t => d.tags?.includes(t))
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      results = results.filter(d => 
        d.analysis && filters.categories.includes(d.analysis.category)
      );
    }

    if (filters.min_confidence) {
      results = results.filter(d => 
        !d.analysis || d.analysis.confidence_score >= filters.min_confidence
      );
    }

    // Only include results with relevance score > 0
    results = results.filter(r => r.relevanceScore > 0);

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return Response.json({
      success: true,
      results: paginatedResults,
      total,
      offset,
      limit
    });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});