import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, reportData } = await req.json();

    // Erstelle CSV-Daten (Excel-kompatibel)
    let csvContent = '';
    
    // Header
    csvContent += `${reportType}\n`;
    csvContent += `Erstellt: ${new Date().toLocaleDateString('de-DE')}\n\n`;

    // Summary
    if (reportData.summary) {
      csvContent += 'Zusammenfassung\n';
      csvContent += 'Kategorie,Metrik,Wert\n';
      
      Object.entries(reportData.summary).forEach(([category, data]) => {
        if (typeof data === 'object') {
          Object.entries(data).forEach(([key, value]) => {
            csvContent += `${category},${key},${value}\n`;
          });
        } else {
          csvContent += `${category},,${data}\n`;
        }
      });
      csvContent += '\n';
    }

    // Stats
    if (reportData.stats) {
      csvContent += 'Statistiken\n';
      csvContent += 'Metrik,Wert\n';
      
      Object.entries(reportData.stats).forEach(([key, value]) => {
        if (typeof value === 'object') {
          csvContent += `${key},${JSON.stringify(value)}\n`;
        } else {
          csvContent += `${key},${value}\n`;
        }
      });
      csvContent += '\n';
    }

    // Metrics
    if (reportData.metrics) {
      csvContent += 'Metriken\n';
      csvContent += 'Kategorie,Wert\n';
      
      Object.entries(reportData.metrics).forEach(([key, value]) => {
        csvContent += `${key},${value}\n`;
      });
      csvContent += '\n';
    }

    // Top Users (falls vorhanden)
    if (reportData.topUsers) {
      csvContent += 'Top Benutzer\n';
      csvContent += 'Rang,User ID,Aktivitäten\n';
      
      reportData.topUsers.forEach((user, idx) => {
        csvContent += `${idx + 1},${user.userId},${user.count}\n`;
      });
      csvContent += '\n';
    }

    // Services (falls vorhanden)
    if (reportData.services) {
      csvContent += 'Services\n';
      csvContent += 'Service,Status,Message\n';
      
      reportData.services.forEach(service => {
        csvContent += `${service.name},${service.status},${service.message || ''}\n`;
      });
    }

    // Konvertiere zu UTF-8 mit BOM für Excel
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const encoder = new TextEncoder();
    const csvBytes = encoder.encode(csvContent);
    const combined = new Uint8Array(bom.length + csvBytes.length);
    combined.set(bom);
    combined.set(csvBytes, bom.length);

    return new Response(combined, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportType.replace(/\s+/g, '_')}.csv"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});