import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenant_email, year, month } = await req.json();
    
    if (!tenant_email || !year || !month) {
      return Response.json({ error: 'tenant_email, year, and month required' }, { status: 400 });
    }

    // Get tenant info
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ email: tenant_email }, null, 1);
    const tenant = tenants[0];

    // Get contract
    const contracts = await base44.asServiceRole.entities.LeaseContract.filter({ tenant_id: tenant?.id }, '-start_date', 1);
    const contract = contracts[0];

    // Get payments for the specified month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const payments = await base44.asServiceRole.entities.Payment.filter({ 
      tenant_email 
    });
    
    const monthPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Mietabrechnung', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Zeitraum: ${month}/${year}`, 20, 30);
    doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 20, 36);
    
    // Tenant Info
    doc.setFontSize(12);
    doc.text('Mieter', 20, 50);
    doc.setFontSize(10);
    doc.text(tenant?.full_name || 'Unbekannt', 20, 57);
    doc.text(tenant?.email || '', 20, 63);
    
    // Contract Info
    doc.setFontSize(12);
    doc.text('Vertragsdetails', 120, 50);
    doc.setFontSize(10);
    doc.text(`Kaltmiete: ${(contract?.base_rent || 0).toFixed(2)}€`, 120, 57);
    doc.text(`Nebenkosten: ${(contract?.utilities || 0).toFixed(2)}€`, 120, 63);
    doc.text(`Heizkosten: ${(contract?.heating || 0).toFixed(2)}€`, 120, 69);
    doc.text(`Warmmiete: ${(contract?.total_rent || 0).toFixed(2)}€`, 120, 75);
    
    // Payment History
    doc.setFontSize(12);
    doc.text('Zahlungen', 20, 90);
    
    let y = 100;
    if (monthPayments.length === 0) {
      doc.setFontSize(10);
      doc.text('Keine Zahlungen in diesem Zeitraum', 20, y);
    } else {
      doc.setFontSize(10);
      monthPayments.forEach(payment => {
        const status = payment.status === 'completed' ? '✓ Bezahlt' : '⏳ Ausstehend';
        doc.text(`${new Date(payment.payment_date).toLocaleDateString('de-DE')}`, 20, y);
        doc.text(`${payment.amount?.toFixed(2)}€`, 80, y);
        doc.text(status, 130, y);
        y += 7;
      });
    }
    
    // Summary
    const totalPaid = monthPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    y += 10;
    doc.setFontSize(12);
    doc.text('Zusammenfassung', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Gesamt bezahlt: ${totalPaid.toFixed(2)}€`, 20, y);
    doc.text(`Soll-Miete: ${(contract?.total_rent || 0).toFixed(2)}€`, 20, y + 7);
    
    const balance = totalPaid - (contract?.total_rent || 0);
    doc.text(`Saldo: ${balance.toFixed(2)}€`, 20, y + 14);

    // Footer
    doc.setFontSize(8);
    doc.text('Hausverwaltung • Automatisch generiert', 20, 280);

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Mietabrechnung_${year}_${month}.pdf"`
      }
    });
    
  } catch (error) {
    console.error('Error generating rent statement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});