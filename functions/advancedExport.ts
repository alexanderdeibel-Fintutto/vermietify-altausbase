import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format, year } = await req.json();

    // Lade alle relevanten Daten
    const submissions = await base44.entities.ElsterSubmission.filter({ tax_year: year });
    const financialItems = await base44.entities.FinancialItem.filter({
      created_date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` }
    });

    let exportData;
    let contentType;
    let fileExtension;

    switch (format) {
      case 'datev':
        exportData = generateDATEVExport(submissions, financialItems);
        contentType = 'text/csv';
        fileExtension = '.csv';
        break;

      case 'elster-backup':
        exportData = generateBackup(submissions, financialItems);
        contentType = 'application/zip';
        fileExtension = '.zip';
        break;

      case 'tax-office':
        exportData = generateTaxOfficeXML(submissions);
        contentType = 'application/xml';
        fileExtension = '.xml';
        break;

      case 'excel':
        exportData = generateExcelReport(submissions, financialItems);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = '.xlsx';
        break;

      default:
        return Response.json({ error: 'Unsupported format' }, { status: 400 });
    }

    return new Response(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="elster-export-${format}${fileExtension}"`
      }
    });

  } catch (error) {
    console.error('Advanced Export Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateDATEVExport(submissions, financialItems) {
  // DATEV CSV Format
  let csv = 'Datum;Konto;Gegenkonto;Betrag;Buchungstext;Beleg\n';
  
  financialItems.forEach(item => {
    const date = new Date(item.created_date).toLocaleDateString('de-DE');
    csv += `${date};${item.account || '1200'};${item.contra_account || '8400'};${item.amount};${item.description};${item.id}\n`;
  });

  return csv;
}

function generateBackup(submissions, financialItems) {
  // JSON Backup
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    submissions,
    financialItems
  };

  return JSON.stringify(backup, null, 2);
}

function generateTaxOfficeXML(submissions) {
  // Simplified XML export
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Steuerdaten>\n';
  
  submissions.forEach(sub => {
    xml += '  <Einreichung>\n';
    xml += `    <Typ>${sub.tax_form_type}</Typ>\n`;
    xml += `    <Jahr>${sub.tax_year}</Jahr>\n`;
    xml += `    <Status>${sub.status}</Status>\n`;
    xml += '  </Einreichung>\n';
  });
  
  xml += '</Steuerdaten>';
  return xml;
}

function generateExcelReport(submissions, financialItems) {
  // Simplified Excel export (in reality use a library like xlsx)
  // For now, return CSV that can be opened in Excel
  let csv = 'Typ;Jahr;Status;Einnahmen;Ausgaben\n';
  
  submissions.forEach(sub => {
    csv += `${sub.tax_form_type};${sub.tax_year};${sub.status};0;0\n`;
  });

  return csv;
}