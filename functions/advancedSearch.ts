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
      entity_types = ['Document', 'DocumentTask', 'DocumentWorkflowRule'],
      filters = {},
      limit = 50
    } = await req.json();

    const results = {};

    // Search Documents
    if (entity_types.includes('Document')) {
      const docs = await base44.entities.Document.list('-updated_date', 100);
      results.documents = docs
        .filter(doc => {
          if (!query && Object.keys(filters).length === 0) return true;
          
          const matchesQuery = !query || 
            doc.name?.toLowerCase().includes(query.toLowerCase()) ||
            doc.document_type?.toLowerCase().includes(query.toLowerCase()) ||
            (doc.tags || []).some(tag => tag.toLowerCase().includes(query.toLowerCase()));
          
          const matchesFilters = applyFilters(doc, filters);
          return matchesQuery && matchesFilters;
        })
        .slice(0, limit);
    }

    // Search Tasks
    if (entity_types.includes('DocumentTask')) {
      const tasks = await base44.entities.DocumentTask.list('-updated_date', 100);
      results.tasks = tasks
        .filter(task => {
          if (!query && Object.keys(filters).length === 0) return true;
          
          const matchesQuery = !query ||
            task.title?.toLowerCase().includes(query.toLowerCase()) ||
            task.task_type?.toLowerCase().includes(query.toLowerCase()) ||
            task.description?.toLowerCase().includes(query.toLowerCase());
          
          const matchesFilters = applyFilters(task, filters);
          return matchesQuery && matchesFilters;
        })
        .slice(0, limit);
    }

    // Search Rules
    if (entity_types.includes('DocumentWorkflowRule')) {
      const rules = await base44.entities.DocumentWorkflowRule.list('-updated_date', 100);
      results.rules = rules
        .filter(rule => {
          if (!query && Object.keys(filters).length === 0) return true;
          
          const matchesQuery = !query ||
            rule.name?.toLowerCase().includes(query.toLowerCase()) ||
            rule.description?.toLowerCase().includes(query.toLowerCase());
          
          const matchesFilters = applyFilters(rule, filters);
          return matchesQuery && matchesFilters;
        })
        .slice(0, limit);
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Advanced search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function applyFilters(item, filters) {
  if (!filters || Object.keys(filters).length === 0) return true;

  // Date filters
  if (filters.from_date) {
    const fromDate = new Date(filters.from_date);
    if (new Date(item.created_date) < fromDate) return false;
  }
  if (filters.to_date) {
    const toDate = new Date(filters.to_date);
    if (new Date(item.created_date) > toDate) return false;
  }

  // Document type filter
  if (filters.document_type && item.document_type !== filters.document_type) {
    return false;
  }

  // Tags filter
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    const itemTags = item.tags || [];
    const hasMatchingTag = filters.tags.some(tag => itemTags.includes(tag));
    if (!hasMatchingTag) return false;
  }

  // Status filter
  if (filters.status && item.status !== filters.status) {
    return false;
  }

  // Assigned to filter
  if (filters.assigned_to && item.assigned_to !== filters.assigned_to) {
    return false;
  }

  // Priority filter
  if (filters.priority && item.priority !== filters.priority) {
    return false;
  }

  return true;
}