import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, entity, metrics, groupBy, period, startDate, endDate } = await req.json();

    if (!entity || !metrics || metrics.length === 0) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch data based on entity type
    let rawData = [];
    
    if (entity === 'FinancialItem') {
      rawData = await base44.entities.FinancialItem.list('-created_date', 1000);
    } else if (entity === 'BuildingTask') {
      rawData = await base44.entities.BuildingTask.list('-created_date', 1000);
    } else if (entity === 'Unit') {
      rawData = await base44.entities.Unit.list('-created_date', 1000);
    } else if (entity === 'Tenant') {
      rawData = await base44.entities.Tenant.list('-created_date', 1000);
    } else if (entity === 'Payment') {
      rawData = await base44.entities.Payment.list('-created_date', 1000);
    } else if (entity === 'Building') {
      rawData = await base44.entities.Building.list('-created_date', 1000);
    } else if (entity === 'LeaseContract') {
      rawData = await base44.entities.LeaseContract.list('-created_date', 1000);
    }

    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      rawData = rawData.filter(item => new Date(item.created_date || item.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      rawData = rawData.filter(item => new Date(item.created_date || item.date) <= end);
    }

    // Group data
    const grouped = {};
    rawData.forEach(item => {
      let key = 'Other';
      
      if (groupBy === 'date') {
        const date = new Date(item.created_date || item.date || new Date());
        if (period === 'monthly') {
          key = date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
        } else if (period === 'yearly') {
          key = date.getFullYear().toString();
        } else {
          key = date.toLocaleDateString('de-DE');
        }
      } else if (groupBy === 'category') {
        key = item.category || 'Uncategorized';
      } else if (groupBy === 'status') {
        key = item.status || 'Unknown';
      } else if (groupBy === 'building') {
        key = item.building_id || 'Unknown';
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    // Calculate metrics for each group
    const chartData = Object.entries(grouped).map(([name, items]) => {
      const result = { name };
      
      metrics.forEach(metric => {
        if (metric === 'amount') {
          result[metric] = items.reduce((sum, item) => sum + (item.amount || 0), 0);
        } else if (metric === 'count') {
          result[metric] = items.length;
        } else if (metric === 'total_income') {
          result[metric] = items.filter(i => i.amount > 0).reduce((sum, i) => sum + i.amount, 0);
        } else if (metric === 'total_expenses') {
          result[metric] = Math.abs(items.filter(i => i.amount < 0).reduce((sum, i) => sum + i.amount, 0));
        } else if (metric === 'occupancy_rate') {
          const occupied = items.filter(i => i.occupancy_status === 'occupied').length;
          result[metric] = items.length > 0 ? Math.round((occupied / items.length) * 100) : 0;
        } else if (metric === 'vacancy_rate') {
          const vacant = items.filter(i => i.occupancy_status === 'vacant').length;
          result[metric] = items.length > 0 ? Math.round((vacant / items.length) * 100) : 0;
        } else if (metric === 'avg_rent') {
          const rents = items.map(i => i.monthly_rent || i.rent_amount || 0);
          result[metric] = rents.length > 0 ? Math.round(rents.reduce((a, b) => a + b) / rents.length) : 0;
        } else {
          // Generic aggregation
          result[metric] = items.length;
        }
      });
      
      return result;
    }).sort((a, b) => {
      // Sort by date if name looks like a date
      if (!isNaN(Date.parse(a.name))) {
        return new Date(a.name) - new Date(b.name);
      }
      return a.name.localeCompare(b.name);
    });

    // Calculate summary
    const summary = {};
    metrics.forEach(metric => {
      const values = chartData.map(item => item[metric] || 0);
      if (metric.includes('rate')) {
        summary[metric] = Math.round(values.reduce((a, b) => a + b) / values.length || 0) + '%';
      } else if (metric.includes('total') || metric === 'amount' || metric === 'avg_rent') {
        summary[metric] = '€' + values.reduce((a, b) => a + b, 0).toLocaleString('de-DE');
      } else {
        summary[metric] = values.reduce((a, b) => a + b, 0);
      }
    });

    return Response.json({
      title,
      entity,
      metrics,
      groupBy,
      period,
      data: chartData,
      summary,
      detailedData: rawData.slice(0, 50),
      chartType: metrics.length === 1 ? 'pie' : 'bar',
      recordCount: rawData.length
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});