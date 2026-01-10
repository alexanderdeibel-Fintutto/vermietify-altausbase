import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, entity, fields, filters, groupBy, sortBy, format } = await req.json();

  // Fetch data
  let data = await base44.entities[entity].list();

  // Apply filters
  if (filters && filters.length > 0) {
    data = data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        const filterValue = filter.value;

        switch (filter.operator) {
          case 'equals':
            return String(value) === String(filterValue);
          case 'contains':
            return String(value || '').toLowerCase().includes(String(filterValue).toLowerCase());
          case 'greater_than':
            return Number(value) > Number(filterValue);
          default:
            return true;
        }
      });
    });
  }

  // Apply sorting
  if (sortBy) {
    data.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  }

  // Extract only selected fields
  const reportData = data.map(item => {
    const row = {};
    fields.forEach(field => {
      row[field] = item[field];
    });
    return row;
  });

  // Generate report based on format
  if (format === 'pdf') {
    // Generate PDF
    const pdfContent = generatePDFContent(name, reportData, fields);
    return Response.json({
      url: 'data:application/pdf;base64,' + btoa(pdfContent),
      count: reportData.length
    });
  } else if (format === 'csv') {
    const csv = generateCSV(reportData, fields);
    return Response.json({
      url: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv),
      count: reportData.length
    });
  } else {
    // Excel format
    return Response.json({
      data: reportData,
      count: reportData.length
    });
  }
});

function generatePDFContent(title, data, fields) {
  let content = `Report: ${title}\n`;
  content += `Generiert: ${new Date().toLocaleDateString()}\n\n`;
  content += `Anzahl Datensätze: ${data.length}\n\n`;
  content += fields.join(' | ') + '\n';
  content += '-'.repeat(80) + '\n';
  
  data.forEach(row => {
    content += fields.map(f => row[f] || '').join(' | ') + '\n';
  });

  return content;
}

function generateCSV(data, fields) {
  let csv = fields.join(',') + '\n';
  data.forEach(row => {
    csv += fields.map(f => `"${row[f] || ''}"`).join(',') + '\n';
  });
  return csv;
}