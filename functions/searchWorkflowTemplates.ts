import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      company_id,
      search_query = '',
      category,
      tags = [],
      difficulty,
      limit = 20
    } = await req.json();

    // Get all templates for company
    const templates = await base44.asServiceRole.entities.WorkflowTemplate.filter({
      company_id
    });

    // Filter based on criteria
    let filtered = templates;

    // Text search
    if (search_query) {
      const query = search_query.toLowerCase();
      filtered = filtered.filter(t =>
        t.name?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }

    // Tags filter
    if (tags.length > 0) {
      filtered = filtered.filter(t =>
        tags.some(tag => t.tags?.includes(tag))
      );
    }

    // Difficulty filter
    if (difficulty) {
      filtered = filtered.filter(t => t.difficulty === difficulty);
    }

    // Sort by usage (popular first)
    filtered.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));

    // Limit results
    const results = filtered.slice(0, limit);

    // Extract unique categories and tags for UI
    const allCategories = [...new Set(templates.map(t => t.category).filter(Boolean))];
    const allTags = [...new Set(templates.flatMap(t => t.tags || []))];

    return Response.json({
      success: true,
      templates: results,
      metadata: {
        total_count: filtered.length,
        categories: allCategories,
        tags: allTags
      }
    });
  } catch (error) {
    console.error('Search workflow templates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});