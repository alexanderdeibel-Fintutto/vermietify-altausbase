import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_type, export_format, date_from, date_to, building_ids } = await req.json();

    let reportData;

    switch (report_type) {
      case 'rent_roll':
        reportData = await generateRentRoll(base44, building_ids, date_from, date_to);
        break;
      case 'vacancy_report':
        reportData = await generateVacancyReport(base44, building_ids, date_from, date_to);
        break;
      case 'outstanding_payments':
        reportData = await generateOutstandingPayments(base44, building_ids, date_from, date_to);
        break;
      case 'financial_summary':
        reportData = await generateFinancialSummary(base44, building_ids, date_from, date_to);
        break;
      default:
        return Response.json({ error: 'Unknown report type' }, { status: 400 });
    }

    if (export_format === 'pdf') {
      const pdfData = generatePDF(reportData, report_type, date_from, date_to);
      return Response.json({ pdf_data: Array.from(pdfData) });
    } else {
      const csvData = generateCSV(reportData, report_type);
      return Response.json({ csv_data: csvData });
    }
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateRentRoll(base44, buildingIds, dateFrom, dateTo) {
  const contracts = await base44.entities.LeaseContract.filter({ vertragsstatus: 'Aktiv' });
  const buildings = await base44.entities.Building.list();
  const units = await base44.entities.Unit.list();
  const tenants = await base44.entities.Tenant.list();

  const rows = contracts.map(contract => {
    const unit = units.find(u => u.id === contract.unit_id);
    const building = buildings.find(b => b.id === unit?.gebaeude_id);
    const tenant = tenants.find(t => t.id === contract.tenant_id);

    return {
      building_name: building?.name || 'N/A',
      unit_number: unit?.unit_number || 'N/A',
      tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'N/A',
      start_date: contract.start_date,
      kaltmiete: contract.kaltmiete || 0,
      nebenkosten: contract.nebenkosten_vz || 0,
      warmmiete: contract.warmmiete || 0,
      status: contract.vertragsstatus
    };
  });

  return {
    title: 'Mietübersicht (Rent Roll)',
    headers: ['Gebäude', 'Einheit', 'Mieter', 'Mietbeginn', 'Kaltmiete', 'NK', 'Warmmiete', 'Status'],
    rows,
    summary: {
      total_contracts: contracts.length,
      total_kaltmiete: rows.reduce((sum, r) => sum + r.kaltmiete, 0),
      total_warmmiete: rows.reduce((sum, r) => sum + r.warmmiete, 0)
    }
  };
}

async function generateVacancyReport(base44, buildingIds, dateFrom, dateTo) {
  const buildings = await base44.entities.Building.list();
  const units = await base44.entities.Unit.list();

  const rows = buildings.map(building => {
    const buildingUnits = units.filter(u => u.gebaeude_id === building.id);
    const totalUnits = buildingUnits.length;
    const vacantUnits = buildingUnits.filter(u => u.vermietungsstatus === 'Leerstand').length;
    const vacancyRate = totalUnits > 0 ? (vacantUnits / totalUnits * 100).toFixed(1) : 0;

    return {
      building_name: building.name,
      address: `${building.address}, ${building.city}`,
      total_units: totalUnits,
      vacant_units: vacantUnits,
      occupied_units: totalUnits - vacantUnits,
      vacancy_rate: vacancyRate
    };
  });

  return {
    title: 'Leerstandsbericht',
    headers: ['Gebäude', 'Adresse', 'Einheiten gesamt', 'Leerstand', 'Vermietet', 'Quote %'],
    rows,
    summary: {
      total_units: rows.reduce((sum, r) => sum + r.total_units, 0),
      total_vacant: rows.reduce((sum, r) => sum + r.vacant_units, 0),
      overall_vacancy_rate: rows.length > 0 
        ? (rows.reduce((sum, r) => sum + r.vacant_units, 0) / rows.reduce((sum, r) => sum + r.total_units, 0) * 100).toFixed(1)
        : 0
    }
  };
}

async function generateOutstandingPayments(base44, buildingIds, dateFrom, dateTo) {
  const bookings = await base44.entities.PlannedBooking.filter({ zahlungsstatus: 'Offen' });
  const buildings = await base44.entities.Building.list();
  const contracts = await base44.entities.LeaseContract.list();
  const tenants = await base44.entities.Tenant.list();

  const rows = bookings
    .filter(b => new Date(b.faelligkeitsdatum) <= new Date(dateTo))
    .map(booking => {
      const contract = contracts.find(c => c.id === booking.contract_id);
      const tenant = tenants.find(t => t.id === contract?.tenant_id);
      const building = buildings.find(b => b.id === booking.building_id);

      return {
        building_name: building?.name || 'N/A',
        tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'N/A',
        booking_text: booking.buchungstext,
        due_date: booking.faelligkeitsdatum,
        amount: booking.betrag,
        days_overdue: Math.max(0, Math.floor((new Date() - new Date(booking.faelligkeitsdatum)) / (1000 * 60 * 60 * 24)))
      };
    })
    .sort((a, b) => b.days_overdue - a.days_overdue);

  return {
    title: 'Offene Zahlungen',
    headers: ['Gebäude', 'Mieter', 'Buchung', 'Fällig am', 'Betrag', 'Tage überfällig'],
    rows,
    summary: {
      total_outstanding: rows.reduce((sum, r) => sum + r.amount, 0),
      count: rows.length,
      overdue_count: rows.filter(r => r.days_overdue > 0).length
    }
  };
}

async function generateFinancialSummary(base44, buildingIds, dateFrom, dateTo) {
  const plannedIncome = await base44.entities.PlannedBooking.filter({
    buchungstyp: 'Einnahme',
    zahlungsstatus: 'Bezahlt'
  });
  
  const actualPayments = await base44.entities.ActualPayment.list();
  const invoices = await base44.entities.Invoice.filter({ zahlungsstatus: 'Bezahlt' });

  const totalIncome = actualPayments
    .filter(p => p.betrag > 0 && new Date(p.zahlungsdatum) >= new Date(dateFrom) && new Date(p.zahlungsdatum) <= new Date(dateTo))
    .reduce((sum, p) => sum + p.betrag, 0);

  const totalExpenses = invoices
    .filter(i => new Date(i.bezahlt_datum) >= new Date(dateFrom) && new Date(i.bezahlt_datum) <= new Date(dateTo))
    .reduce((sum, i) => sum + i.betrag_brutto, 0);

  const rows = [
    { category: 'Mieteinnahmen', amount: totalIncome },
    { category: 'Ausgaben', amount: -totalExpenses },
    { category: 'Netto-Cashflow', amount: totalIncome - totalExpenses }
  ];

  return {
    title: 'Finanzübersicht',
    headers: ['Kategorie', 'Betrag'],
    rows,
    summary: {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_cashflow: totalIncome - totalExpenses
    }
  };
}

function generatePDF(reportData, reportType, dateFrom, dateTo) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(reportData.title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Zeitraum: ${dateFrom} bis ${dateTo}`, 20, 30);
  doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 20, 35);

  let y = 50;

  reportData.rows.forEach((row, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(9);
    const values = Object.values(row);
    values.forEach((val, i) => {
      const x = 20 + (i * 35);
      const text = typeof val === 'number' 
        ? val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
        : String(val).substring(0, 20);
      doc.text(text, x, y);
    });
    y += 8;
  });

  if (reportData.summary) {
    y += 10;
    doc.setFontSize(11);
    doc.text('Zusammenfassung:', 20, y);
    y += 10;
    doc.setFontSize(9);
    Object.entries(reportData.summary).forEach(([key, value]) => {
      const displayValue = typeof value === 'number'
        ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
        : value;
      doc.text(`${key}: ${displayValue}`, 20, y);
      y += 7;
    });
  }

  return doc.output('arraybuffer');
}

function generateCSV(reportData, reportType) {
  let csv = reportData.headers.join(';') + '\n';

  reportData.rows.forEach(row => {
    const values = Object.values(row).map(v => {
      if (typeof v === 'number') {
        return v.toFixed(2).replace('.', ',');
      }
      return String(v).replace(/;/g, ',');
    });
    csv += values.join(';') + '\n';
  });

  csv += '\n';
  csv += 'Zusammenfassung\n';
  if (reportData.summary) {
    Object.entries(reportData.summary).forEach(([key, value]) => {
      csv += `${key};${typeof value === 'number' ? value.toFixed(2).replace('.', ',') : value}\n`;
    });
  }

  return csv;
}