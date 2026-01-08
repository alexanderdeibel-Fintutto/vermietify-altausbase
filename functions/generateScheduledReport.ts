import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { scheduleId } = await req.json();

    if (!scheduleId) {
      return Response.json({ error: 'Missing scheduleId' }, { status: 400 });
    }

    // Get schedule
    const schedule = await base44.asServiceRole.entities.ReportSchedule.filter({ id: scheduleId });
    if (!schedule || schedule.length === 0) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const reportSchedule = schedule[0];

    // Generate report based on type
    let reportData;
    switch (reportSchedule.report_type) {
      case 'financial':
        reportData = await generateFinancialReport(base44);
        break;
      case 'occupancy':
        reportData = await generateOccupancyReport(base44);
        break;
      case 'contracts':
        reportData = await generateContractsReport(base44);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(base44);
        break;
      case 'user_activity':
        reportData = await generateUserActivityReport(base44);
        break;
      default:
        reportData = { message: 'Custom report type' };
    }

    // Generate PDF/Excel
    const formats = [];
    if (reportSchedule.format === 'pdf' || reportSchedule.format === 'both') {
      const pdfResponse = await base44.asServiceRole.functions.invoke('exportReportToPDF', {
        reportType: reportSchedule.report_type,
        reportData
      });
      formats.push({ type: 'pdf', data: pdfResponse.data });
    }
    if (reportSchedule.format === 'excel' || reportSchedule.format === 'both') {
      const excelResponse = await base44.asServiceRole.functions.invoke('exportReportToExcel', {
        reportType: reportSchedule.report_type,
        reportData
      });
      formats.push({ type: 'excel', data: excelResponse.data });
    }

    // Send emails to recipients
    for (const recipient of reportSchedule.recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient,
        subject: `${reportSchedule.name} - ${new Date().toLocaleDateString('de-DE')}`,
        body: `
          <h2>${reportSchedule.name}</h2>
          <p>Anbei finden Sie den automatisch generierten Report.</p>
          <p>Report-Typ: ${reportSchedule.report_type}</p>
          <p>Generiert am: ${new Date().toLocaleString('de-DE')}</p>
        `
      });
    }

    // Update last_run
    await base44.asServiceRole.entities.ReportSchedule.update(scheduleId, {
      last_run: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: `Report generiert und an ${reportSchedule.recipients.length} Empfänger versendet`
    });
  } catch (error) {
    console.error('Error generating scheduled report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateFinancialReport(base44) {
  const financialItems = await base44.asServiceRole.entities.FinancialItem.list();
  const income = financialItems.filter(i => i.type === 'income').reduce((sum, i) => sum + (i.amount || 0), 0);
  const expenses = financialItems.filter(i => i.type === 'expense').reduce((sum, i) => sum + Math.abs(i.amount || 0), 0);
  
  return {
    totalIncome: income,
    totalExpenses: expenses,
    netProfit: income - expenses,
    items: financialItems
  };
}

async function generateOccupancyReport(base44) {
  const units = await base44.asServiceRole.entities.Unit.list();
  return {
    total: units.length,
    occupied: units.filter(u => u.status === 'occupied').length,
    vacant: units.filter(u => u.status === 'vacant').length,
    occupancyRate: (units.filter(u => u.status === 'occupied').length / units.length * 100).toFixed(1)
  };
}

async function generateContractsReport(base44) {
  const contracts = await base44.asServiceRole.entities.LeaseContract.list();
  return {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiring: contracts.filter(c => c.status === 'expiring').length,
    terminated: contracts.filter(c => c.status === 'terminated').length
  };
}

async function generatePerformanceReport(base44) {
  const buildings = await base44.asServiceRole.entities.Building.list();
  return {
    totalBuildings: buildings.length,
    performance: 'High' // Mock data
  };
}

async function generateUserActivityReport(base44) {
  const activities = await base44.asServiceRole.entities.UserActivity.list('-created_date', 100);
  return {
    totalActivities: activities.length,
    uniqueUsers: [...new Set(activities.map(a => a.user_id))].length
  };
}