import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { invoiceId, status, paymentDate, paymentAmount } = body;

        // Aktualisiere Zahlungsstatus
        if (invoiceId && status) {
            const invoice = await base44.entities.GeneratedDocument.filter({ id: invoiceId });
            
            if (!invoice || invoice.length === 0) {
                return Response.json({ error: 'Invoice not found' }, { status: 404 });
            }

            const updatedInvoice = await base44.entities.GeneratedDocument.update(invoiceId, {
                distribution_status: status === 'paid' ? 'sent' : status,
                document_data: {
                    ...invoice[0].document_data,
                    paymentStatus: status,
                    paymentDate: paymentDate || null,
                    paymentAmount: paymentAmount || invoice[0].document_data?.amount
                }
            });

            // Erstelle Payment-Record
            if (status === 'paid') {
                await base44.entities.Payment.create({
                    invoice_id: invoiceId,
                    tenant_id: invoice[0].tenant_id,
                    amount: paymentAmount || invoice[0].document_data?.amount,
                    payment_date: paymentDate || new Date().toISOString(),
                    payment_method: 'bank_transfer',
                    status: 'completed'
                });

                // Sende Bestätigung an Mieter
                const tenant = await base44.entities.Tenant.filter({ id: invoice[0].tenant_id });
                if (tenant && tenant[0]?.email) {
                    await base44.integrations.Core.SendEmail({
                        to: tenant[0].email,
                        subject: `Zahlungsbestätigung - Rechnung ${invoice[0].document_data?.invoiceNumber}`,
                        body: `Sehr geehrte/r ${tenant[0]?.first_name},\n\nwir bestätigen den Erhalt Ihrer Zahlung.\n\nRechnungsnummer: ${invoice[0].document_data?.invoiceNumber}\nZahlter Betrag: ${paymentAmount || invoice[0].document_data?.amount}€\nZahlungsdatum: ${paymentDate || new Date().toLocaleDateString('de-DE')}\n\nVielen Dank!\n\nMit freundlichen Grüßen`
                    });
                }
            }

            return Response.json({
                success: true,
                invoice: updatedInvoice,
                message: 'Zahlungsstatus aktualisiert'
            });
        }

        // Hole alle Zahlungen eines Mieters
        if (body.tenantId) {
            const payments = await base44.entities.Payment.filter({
                tenant_id: body.tenantId
            });

            const summary = {
                totalPayments: payments.length,
                totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                payments: payments
            };

            return Response.json({
                success: true,
                data: summary
            });
        }

        // Hole überfällige Zahlungen
        const today = new Date();
        const overduePayments = await base44.entities.GeneratedDocument.filter({
            distribution_status: 'generated'
        });

        const overdue = overduePayments.filter(inv => {
            const dueDate = new Date(inv.document_data?.dueDate);
            return dueDate < today;
        });

        return Response.json({
            success: true,
            overdueCount: overdue.length,
            overduePayments: overdue,
            totalOverdueAmount: overdue.reduce((sum, inv) => sum + (inv.document_data?.amount || 0), 0)
        });
    } catch (error) {
        console.error('Fehler:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});