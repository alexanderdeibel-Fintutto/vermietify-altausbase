import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payment_id } = await req.json();

    if (!payment_id) {
      return Response.json(
        { error: 'Missing payment_id' },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await base44.entities.Payment.read(payment_id);
    const tenant = await base44.entities.Tenant.read(payment.tenant_id);

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFontSize(20);
    doc.text('Zahlungsquittung', 20, 20);

    // Receipt details
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    const details = [
      `Mieter: ${tenant.first_name} ${tenant.last_name}`,
      `Email: ${tenant.email}`,
      `Zahlungs-ID: ${payment.id}`,
      `Datum: ${new Date(payment.payment_date).toLocaleDateString('de-DE')}`,
      `Betrag: €${payment.amount.toFixed(2)}`,
      `Status: ${payment.status === 'completed' ? 'Bezahlt' : 'Ausstehend'}`,
      `Beschreibung: ${payment.description}`,
    ];

    let yPos = 40;
    details.forEach(detail => {
      doc.text(detail, 20, yPos);
      yPos += 8;
    });

    // Footer
    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.text(
      'Diese Quittung wurde automatisch generiert.',
      20,
      pageHeight - 20
    );

    // Upload to storage
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `receipt_${payment_id}.pdf`, { type: 'application/pdf' });

    const uploadResponse = await base44.integrations.Core.UploadFile({
      file: file,
    });

    return Response.json({
      receipt_url: uploadResponse.file_url,
      payment_id,
    });
  } catch (error) {
    console.error('Receipt generation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});