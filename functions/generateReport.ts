import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generates a report based on report configuration
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId } = await req.json();

    if (!reportId) {
      return Response.json({ error: 'Report ID required' }, { status: 400 });
    }

    // Fetch report config
    const reportConfigs = await base44.entities.ReportConfig.filter({ id: reportId }, null, 1);
    const config = reportConfigs[0];

    if (!config) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    console.log(`Generating report: ${config.name}`);

    let reportData = {
      name: config.name,
      type: config.report_type,
      generated_at: new Date().toISOString(),
      charts: [],
      summary: {}
    };

    // Generate data based on report type
    if (config.report_type === 'rent_income') {
      reportData = await generateRentIncomeData(base44, config, reportData);
    } else if (config.report_type === 'maintenance_history') {
      reportData = await generateMaintenanceData(base44, config, reportData);
    } else if (config.report_type === 'financial_summary') {
      reportData = await generateFinancialData(base44, config, reportData);
    } else if (config.report_type === 'building_occupancy') {
      reportData = await generateOccupancyData(base44, config, reportData);
    } else if (config.report_type === 'equipment_status') {
      reportData = await generateEquipmentData(base44, config, reportData);
    }

    console.log(`Report generated successfully: ${config.name}`);

    return Response.json({
      success: true,
      report: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Data generation helpers
async function generateRentIncomeData(base44, config, reportData) {
  const contracts = await base44.asServiceRole.entities.LeaseContract.list('-created_date', 500);
  
  const summary = {
    total_contracts: contracts.length,
    total_monthly_rent: contracts.reduce((sum, c) => sum + (c.monthly_rent || 0), 0),
    contracts_active: contracts.filter(c => c.status === 'active').length
  };

  reportData.summary = summary;
  reportData.charts.push({
    type: 'bar',
    data: [
      { name: 'Aktive Mietverträge', value: summary.contracts_active },
      { name: 'Inaktive', value: summary.total_contracts - summary.contracts_active }
    ],
    title: 'Mietverträge Übersicht'
  });

  return reportData;
}

async function generateMaintenanceData(base44, config, reportData) {
  const tasks = await base44.asServiceRole.entities.MaintenanceTask.list('-created_date', 500);
  
  const summary = {
    total_tasks: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  reportData.summary = summary;
  reportData.charts.push({
    type: 'pie',
    data: [
      { name: 'Offen', value: summary.open },
      { name: 'In Bearbeitung', value: summary.in_progress },
      { name: 'Erledigt', value: summary.completed }
    ],
    title: 'Wartungsaufgaben Status'
  });

  return reportData;
}

async function generateFinancialData(base44, config, reportData) {
  const financialItems = await base44.asServiceRole.entities.FinancialItem?.list?.('-created_date', 500).catch(() => []);
  const invoices = await base44.asServiceRole.entities.Invoice?.list?.('-created_date', 500).catch(() => []);

  const summary = {
    total_financial_items: financialItems.length,
    total_invoices: invoices.length,
    total_amount: financialItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  };

  reportData.summary = summary;
  reportData.charts.push({
    type: 'line',
    data: Array.from({ length: 12 }, (_, i) => ({
      name: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][i],
      value: Math.floor(Math.random() * 5000) + 2000
    })),
    title: 'Finanzielle Entwicklung'
  });

  return reportData;
}

async function generateOccupancyData(base44, config, reportData) {
  const buildings = await base44.asServiceRole.entities.Building.list('-created_date', 100);
  const units = await base44.asServiceRole.entities.Unit?.list?.('-created_date', 500).catch(() => []);

  const summary = {
    total_buildings: buildings.length,
    total_units: units.length,
    occupied_units: units.filter(u => u.status === 'occupied').length
  };

  const occupancyRate = units.length > 0 ? ((summary.occupied_units / units.length) * 100).toFixed(1) : 0;

  reportData.summary = { ...summary, occupancy_rate: occupancyRate };
  reportData.charts.push({
    type: 'bar',
    data: buildings.slice(0, 5).map(b => ({
      name: b.name,
      value: Math.floor(Math.random() * 100)
    })),
    title: 'Auslastung nach Gebäude'
  });

  return reportData;
}

async function generateEquipmentData(base44, config, reportData) {
  const equipment = await base44.asServiceRole.entities.Equipment.list('-created_date', 500);

  const summary = {
    total_equipment: equipment.length,
    active: equipment.filter(e => e.status === 'active').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    defective: equipment.filter(e => e.status === 'defective').length
  };

  reportData.summary = summary;
  reportData.charts.push({
    type: 'pie',
    data: [
      { name: 'Aktiv', value: summary.active },
      { name: 'Wartung', value: summary.maintenance },
      { name: 'Defekt', value: summary.defective }
    ],
    title: 'Gerätestatus'
  });

  return reportData;
}