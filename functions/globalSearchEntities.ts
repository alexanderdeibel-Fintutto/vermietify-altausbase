import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, limit = 50 } = await req.json();

  if (!query || query.length < 2) {
    return Response.json({ results: [] });
  }

  const searchTerm = query.toLowerCase();
  const results = [];

  // Search Buildings
  try {
    const buildings = await base44.entities.Building.list();
    buildings.forEach(item => {
      const score = calculateScore(searchTerm, item, ['name', 'address', 'postal_code', 'city']);
      if (score > 0) {
        results.push({
          id: item.id,
          type: 'Building',
          title: item.name,
          subtitle: `${item.address}, ${item.postal_code} ${item.city}`,
          url: `/buildings/${item.id}`,
          score
        });
      }
    });
  } catch (e) {}

  // Search Units
  try {
    const units = await base44.entities.Unit.list();
    units.forEach(item => {
      const score = calculateScore(searchTerm, item, ['unit_number', 'floor', 'area']);
      if (score > 0) {
        results.push({
          id: item.id,
          type: 'Unit',
          title: `Einheit ${item.unit_number}`,
          subtitle: `${item.floor}. Stock, ${item.area} m²`,
          url: `/units/${item.id}`,
          score
        });
      }
    });
  } catch (e) {}

  // Search Tenants
  try {
    const tenants = await base44.entities.Tenant.list();
    tenants.forEach(item => {
      const score = calculateScore(searchTerm, item, ['first_name', 'last_name', 'email', 'phone']);
      if (score > 0) {
        results.push({
          id: item.id,
          type: 'Tenant',
          title: `${item.first_name} ${item.last_name}`,
          subtitle: item.email,
          url: `/tenants/${item.id}`,
          score
        });
      }
    });
  } catch (e) {}

  // Search Contracts
  try {
    const contracts = await base44.entities.LeaseContract.list();
    for (const item of contracts) {
      const tenant = item.tenant_id 
        ? await base44.entities.Tenant.filter({ id: item.tenant_id }).then(t => t[0])
        : null;
      const score = calculateScore(searchTerm, item, ['contract_date', 'start_date']);
      if (score > 0 || (tenant && calculateScore(searchTerm, tenant, ['first_name', 'last_name']) > 0)) {
        results.push({
          id: item.id,
          type: 'LeaseContract',
          title: tenant ? `Vertrag: ${tenant.first_name} ${tenant.last_name}` : `Vertrag ${item.id}`,
          subtitle: `Start: ${new Date(item.start_date).toLocaleDateString('de-DE')}`,
          url: `/contracts/${item.id}`,
          score: Math.max(score, tenant ? calculateScore(searchTerm, tenant, ['first_name', 'last_name']) : 0)
        });
      }
    }
  } catch (e) {}

  // Search Payments
  try {
    const payments = await base44.entities.Payment.list();
    payments.forEach(item => {
      const score = calculateScore(searchTerm, item, ['amount', 'payment_type', 'reference']);
      if (score > 0) {
        results.push({
          id: item.id,
          type: 'Payment',
          title: `Zahlung ${item.amount}€`,
          subtitle: `${item.payment_type} - ${new Date(item.payment_date || item.created_date).toLocaleDateString('de-DE')}`,
          url: `/payments`,
          score
        });
      }
    });
  } catch (e) {}

  // Search Maintenance Tasks
  try {
    const tasks = await base44.entities.MaintenanceTask.list();
    tasks.forEach(item => {
      const score = calculateScore(searchTerm, item, ['title', 'description', 'category', 'status']);
      if (score > 0) {
        results.push({
          id: item.id,
          type: 'MaintenanceTask',
          title: item.title,
          subtitle: `${item.category} - ${item.status}`,
          url: `/maintenance-tasks`,
          score
        });
      }
    });
  } catch (e) {}

  // Search Documents
  try {
    const documents = await base44.entities.Document.list();
    documents.forEach(item => {
      const score = calculateScore(searchTerm, item, ['name', 'category', 'notes']);
      if (score > 0) {
        results.push({
          id: item.id,
          type: 'Document',
          title: item.name,
          subtitle: item.category || 'Dokument',
          url: `/documents`,
          score
        });
      }
    });
  } catch (e) {}

  // Search Tasks
  try {
    const tasks = await base44.entities.BuildingTask.list();
    tasks.forEach(item => {
      const score = calculateScore(searchTerm, item, ['task_title', 'description', 'task_type']);
      if (score > 0) {
        results.push({
          id: item.id,
          type: 'BuildingTask',
          title: item.task_title,
          subtitle: item.task_type,
          url: `/tasks`,
          score
        });
      }
    });
  } catch (e) {}

  // Sort by score and limit
  results.sort((a, b) => b.score - a.score);
  const limitedResults = results.slice(0, limit);

  return Response.json({ 
    results: limitedResults,
    total: results.length,
    query 
  });
});

function calculateScore(searchTerm, item, fields) {
  let score = 0;
  
  fields.forEach(field => {
    const value = String(item[field] || '').toLowerCase();
    
    if (value === searchTerm) {
      score += 100; // Exact match
    } else if (value.startsWith(searchTerm)) {
      score += 50; // Starts with
    } else if (value.includes(searchTerm)) {
      score += 25; // Contains
    }
  });

  return score;
}