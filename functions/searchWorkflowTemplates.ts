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
      search_query,
      category,
      tags,
      difficulty,
      is_public
    } = await req.json();

    // Get all templates
    let templates = await base44.asServiceRole.entities.WorkflowTemplate.filter({
      company_id
    });

    // Apply filters
    if (search_query) {
      const query = search_query.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (difficulty) {
      templates = templates.filter(t => t.difficulty === difficulty);
    }

    if (tags && tags.length > 0) {
      templates = templates.filter(t =>
        tags.some(tag => t.tags?.includes(tag))
      );
    }

    if (typeof is_public === 'boolean') {
      templates = templates.filter(t => t.is_public === is_public);
    }

    // Get unique values for filters
    const allTemplates = await base44.asServiceRole.entities.WorkflowTemplate.filter({
      company_id
    });

    const categories = [...new Set(allTemplates.map(t => t.category).filter(Boolean))];
    const difficulties = [...new Set(allTemplates.map(t => t.difficulty).filter(Boolean))];
    const allTags = [...new Set(allTemplates.flatMap(t => t.tags || []))];

    return Response.json({
      success: true,
      templates,
      filters: {
        categories,
        difficulties,
        tags: allTags
      },
      total_results: templates.length
    });
  } catch (error) {
    console.error('Search workflow templates error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});