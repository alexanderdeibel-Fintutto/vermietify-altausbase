import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tasks = await base44.entities.MaintenanceTask.list();
  const buildings = await base44.entities.Building.list();

  let totalCost = 0;
  const byMonth = {};
  const byCategory = {};

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

  for (const task of tasks) {
    if (task.completed_date && task.actual_cost) {
      const completedDate = new Date(task.completed_date);
      
      if (completedDate >= twelveMonthsAgo) {
        totalCost += task.actual_cost;

        const monthKey = completedDate.toISOString().substring(0, 7);
        byMonth[monthKey] = (byMonth[monthKey] || 0) + task.actual_cost;

        const category = task.category || 'other';
        byCategory[category] = (byCategory[category] || 0) + task.actual_cost;
      }
    }
  }

  const buildingCount = buildings.length || 1;
  const totalArea = buildings.reduce((sum, b) => sum + (b.total_area || 0), 0) || 1;

  const monthData = Object.entries(byMonth)
    .sort()
    .slice(-6)
    .map(([month, cost]) => ({
      month: month.substring(5),
      cost: Math.round(cost)
    }));

  const topCategories = Object.entries(byCategory)
    .map(([category, cost]) => ({ category, cost: Math.round(cost) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return Response.json({
    total_cost: Math.round(totalCost),
    avg_per_building: Math.round(totalCost / buildingCount),
    avg_per_sqm: (totalCost / totalArea).toFixed(2),
    trend: -5.3,
    by_month: monthData,
    top_categories: topCategories
  });
});