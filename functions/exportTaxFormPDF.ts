import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { submission_id } = await req.json();

    const submission = await base44.asServiceRole.entities.ElsterSubmission.get(submission_id);
    
    if (!submission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 });
    }

    const building = await base44.asServiceRole.entities.Building.get(submission.building_id);

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('ELSTER Steuerformular', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Formular: ${submission.tax_form_type}`, 20, 35);
    doc.text(`Jahr: ${submission.tax_year}`, 20, 42);
    doc.text(`Objekt: ${building.address || building.name}`, 20, 49);
    doc.text(`Rechtsform: ${submission.legal_form}`, 20, 56);
    
    // Status
    doc.setFontSize(10);
    doc.text(`Status: ${submission.status}`, 20, 70);
    if (submission.transfer_ticket) {
      doc.text(`Transfer-Ticket: ${submission.transfer_ticket}`, 20, 77);
    }
    if (submission.ai_confidence_score) {
      doc.text(`KI-Vertrauen: ${submission.ai_confidence_score}%`, 20, 84);
    }

    // Formular-Daten
    doc.setFontSize(14);
    doc.text('Formular-Daten:', 20, 100);
    
    doc.setFontSize(10);
    let y = 110;
    
    if (submission.form_data) {
      for (const [key, value] of Object.entries(submission.form_data)) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(`${key}:`, 20, y);
        doc.text(String(value || ''), 80, y);
        y += 7;
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.text(`Erstellt: ${new Date().toLocaleString('de-DE')}`, 20, 285);
    doc.text(`Ersteller: ${user.email}`, 120, 285);

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=elster_${submission.tax_form_type}_${submission.tax_year}.pdf`
      }
    });

  } catch (error) {
    console.error('Error exporting PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});