import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { report_data, report_name, format } = body;

    if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(report_name || 'Bericht', 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 20, 30);
      
      doc.setFontSize(12);
      let y = 50;
      
      if (report_data && typeof report_data === 'object') {
        Object.entries(report_data).forEach(([key, value]) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(`${key}: ${value}`, 20, y);
          y += 10;
        });
      }

      const pdfBytes = doc.output('arraybuffer');
      
      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${report_name || 'report'}.pdf"`
        }
      });
    }

    if (format === 'csv') {
      const csv = Object.entries(report_data)
        .map(([key, value]) => `"${key}","${value}"`)
        .join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report_name || 'report'}.csv"`
        }
      });
    }

    return Response.json({ error: 'Unsupported format' }, { status: 400 });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});