import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportType, reportData } = await req.json();

    const doc = new jsPDF();
    let yPos = 20;

    // Titel
    doc.setFontSize(20);
    doc.text(reportType, 20, yPos);
    yPos += 10;

    // Datum
    doc.setFontSize(10);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 20, yPos);
    yPos += 15;

    // Report-Daten verarbeiten
    doc.setFontSize(12);
    
    if (reportData.summary) {
      doc.text('Zusammenfassung:', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      Object.entries(reportData.summary).forEach(([key, value]) => {
        if (typeof value === 'object') {
          doc.text(`${key}:`, 20, yPos);
          yPos += 6;
          Object.entries(value).forEach(([k, v]) => {
            doc.text(`  ${k}: ${v}`, 25, yPos);
            yPos += 5;
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
          });
          yPos += 3;
        } else {
          doc.text(`${key}: ${value}`, 20, yPos);
          yPos += 6;
        }
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    }

    if (reportData.stats) {
      yPos += 5;
      doc.setFontSize(12);
      doc.text('Statistiken:', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      Object.entries(reportData.stats).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPos);
        yPos += 6;
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    }

    if (reportData.metrics) {
      yPos += 5;
      doc.setFontSize(12);
      doc.text('Metriken:', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      Object.entries(reportData.metrics).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPos);
        yPos += 6;
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportType.replace(/\s+/g, '_')}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});