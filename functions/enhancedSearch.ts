import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { entity, conditions } = await req.json();

  // Get all entities
  const allItems = await base44.entities[entity].list();

  // Filter based on conditions
  const results = allItems.filter(item => {
    return conditions.every(condition => {
      const fieldValue = item[condition.field];
      const condValue = condition.value;

      switch (condition.operator) {
        case 'equals':
          return String(fieldValue) === String(condValue);
        
        case 'not_equals':
          return String(fieldValue) !== String(condValue);
        
        case 'contains':
          return String(fieldValue || '').toLowerCase().includes(String(condValue).toLowerCase());
        
        case 'not_contains':
          return !String(fieldValue || '').toLowerCase().includes(String(condValue).toLowerCase());
        
        case 'starts_with':
          return String(fieldValue || '').toLowerCase().startsWith(String(condValue).toLowerCase());
        
        case 'ends_with':
          return String(fieldValue || '').toLowerCase().endsWith(String(condValue).toLowerCase());
        
        case 'greater_than':
          return Number(fieldValue) > Number(condValue);
        
        case 'less_than':
          return Number(fieldValue) < Number(condValue);
        
        case 'greater_equal':
          return Number(fieldValue) >= Number(condValue);
        
        case 'less_equal':
          return Number(fieldValue) <= Number(condValue);
        
        case 'is_empty':
          return !fieldValue || fieldValue === '' || fieldValue === null;
        
        case 'is_not_empty':
          return fieldValue && fieldValue !== '' && fieldValue !== null;
        
        case 'in_last_days': {
          if (!fieldValue) return false;
          const days = Number(condValue);
          const fieldDate = new Date(fieldValue);
          const now = new Date();
          const diffTime = now - fieldDate;
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= days;
        }
        
        case 'before_days': {
          if (!fieldValue) return false;
          const days = Number(condValue);
          const fieldDate = new Date(fieldValue);
          const now = new Date();
          const diffTime = now - fieldDate;
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return diffDays > days;
        }
        
        case 'in_next_days': {
          if (!fieldValue) return false;
          const days = Number(condValue);
          const fieldDate = new Date(fieldValue);
          const now = new Date();
          const diffTime = fieldDate - now;
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= days;
        }
        
        case 'between_dates': {
          if (!fieldValue) return false;
          const [startDate, endDate] = condValue.split(',');
          const fieldDate = new Date(fieldValue);
          return fieldDate >= new Date(startDate) && fieldDate <= new Date(endDate);
        }
        
        default:
          return true;
      }
    });
  });

  return Response.json(results);
});