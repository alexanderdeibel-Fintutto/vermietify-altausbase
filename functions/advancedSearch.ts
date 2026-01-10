import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { filters } = await req.json();

  const results = [
    { id: '1', name: 'Musterstraße 123', type: 'Building' },
    { id: '2', name: 'Max Mustermann', type: 'Tenant' },
    { id: '3', name: 'Mietvertrag 2024', type: 'Contract' }
  ].filter(item => {
    return filters.every(filter => {
      const value = item[filter.field] || '';
      switch (filter.operator) {
        case 'contains':
          return value.toLowerCase().includes(filter.value.toLowerCase());
        case 'equals':
          return value === filter.value;
        default:
          return true;
      }
    });
  });

  return Response.json({ results });
});