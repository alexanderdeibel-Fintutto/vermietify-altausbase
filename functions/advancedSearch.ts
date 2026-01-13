import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityType, filters } = await req.json();

    // Build query from filters
    let query = {};
    filters.forEach(filter => {
      if (filter.operator === 'contains') {
        query[filter.field] = { $regex: filter.value, $options: 'i' };
      } else if (filter.operator === 'equals') {
        query[filter.field] = filter.value;
      } else if (filter.operator === 'greater_than') {
        query[filter.field] = { $gte: parseFloat(filter.value) };
      } else if (filter.operator === 'less_than') {
        query[filter.field] = { $lte: parseFloat(filter.value) };
      }
    });

    // Execute search
    const results = await base44.entities[entityType].list();
    const filtered = results.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        if (typeof value === 'object' && value.$regex) {
          return new RegExp(value.$regex, value.$options).test(item[key]);
        }
        return item[key] === value;
      });
    });

    return Response.json({ 
      data: filtered,
      count: filtered.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});