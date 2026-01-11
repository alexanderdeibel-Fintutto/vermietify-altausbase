import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const overdueInvoices = [];
        const remindersSent = [];

        // Hole alle unbezahlten Rechnungen
        const unpaidInvoices = await base44.entities.GeneratedDocument.filter({
            document_type: 'mietvertrag',
            distribution_status: 'generated'
        });

        for (const invoice of unpaidInvoices) {
            const dueDate = new Date(invoice.document_data?.dueDate);
            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

            // Zahlungserinnerung: 3 Tage vor Fälligkeit
            if (daysOverdue === -3) {
                const tenant = await base44.entities.Tenant.filter({ id: invoice.tenant_id });
                if (tenant && tenant[0]?.email) {
                    await base44.integrations.Core.SendEmail({
                        to: tenant[0].email,
                        subject: `Zahlungserinnerung - Rechnung ${invoice.document_data?.invoiceNumber}`,
                        body: `Sehr geehrte/r ${tenant[0]?.first_name},\n\nwir möchten Sie höflich daran erinnern, dass Ihre Mietzahlung in 3 Tagen fällig ist.\n\nRechnungsnummer: ${invoice.document_data?.invoiceNumber}\nBetrag: ${invoice.document_data?.amount}€\nFälligkeitsdatum: ${dueDate.toLocaleDateString('de-DE')}\n\nBitte überweisen Sie den Betrag pünktlich.\n\nMit freundlichen Grüßen`
                    });
                    remindersSent.push(invoice.id);
                }
            }

            // Mahnung: 10 Tage überfällig
            if (daysOverdue === 10) {
                const tenant = await base44.entities.Tenant.filter({ id: invoice.tenant_id });
                if (tenant && tenant[0]?.email) {
                    // Erstelle Mahnungsdokument
                    const dunningDocument = await base44.entities.GeneratedDocument.create({
                        document_type: 'mahnung',
                        contract_id: invoice.contract_id,
                        tenant_id: invoice.tenant_id,
                        unit_id: invoice.unit_id,
                        building_id: invoice.building_id,
                        pdf_url: null,
                        document_data: {
                            originalInvoiceNumber: invoice.document_data?.invoiceNumber,
                            amount: invoice.document_data?.amount,
                            daysOverdue: daysOverdue,
                            dunningLevel: 1,
                            dunningDate: today.toISOString().split('T')[0]
                        },
                        distribution_status: 'queued'
                    });

                    // Sende Mahnung per Email
                    await base44.integrations.Core.SendEmail({
                        to: tenant[0].email,
                        subject: `MAHNUNG - Rechnung ${invoice.document_data?.invoiceNumber}`,
                        body: `Sehr geehrte/r ${tenant[0]?.first_name},\n\ndie obenstehende Rechnung ist bereits ${daysOverdue} Tage überfällig.\n\nRechnungsnummer: ${invoice.document_data?.invoiceNumber}\nBetrag: ${invoice.document_data?.amount}€\nÜberfällig seit: ${daysOverdue} Tagen\n\nBitte überweisen Sie den Betrag sofort.\n\nMit freundlichen Grüßen`
                    });

                    overdueInvoices.push(dunningDocument);
                }
            }

            // 2. Mahnung: 20 Tage überfällig
            if (daysOverdue === 20) {
                const tenant = await base44.entities.Tenant.filter({ id: invoice.tenant_id });
                if (tenant && tenant[0]?.email) {
                    const dunningDocument = await base44.entities.GeneratedDocument.create({
                        document_type: 'abmahnung',
                        contract_id: invoice.contract_id,
                        tenant_id: invoice.tenant_id,
                        unit_id: invoice.unit_id,
                        building_id: invoice.building_id,
                        pdf_url: null,
                        document_data: {
                            originalInvoiceNumber: invoice.document_data?.invoiceNumber,
                            amount: invoice.document_data?.amount,
                            daysOverdue: daysOverdue,
                            dunningLevel: 2,
                            dunningDate: today.toISOString().split('T')[0],
                            warning: 'LETZTE MAHNUNG VOR KÜNDIGUNG'
                        },
                        distribution_status: 'queued'
                    });

                    await base44.integrations.Core.SendEmail({
                        to: tenant[0].email,
                        subject: `ABMAHNUNG - LETZTE MAHNUNG VOR RECHTLICHEN MASSNAHMEN`,
                        body: `Sehr geehrte/r ${tenant[0]?.first_name},\n\ndie obenstehende Rechnung ist bereits ${daysOverdue} Tage überfällig. Dies ist unsere letzte Mahnung.\n\nRechnungsnummer: ${invoice.document_data?.invoiceNumber}\nBetrag: ${invoice.document_data?.amount}€\n\nSollten Sie bis zum nächsten Werktag nicht zahlen, werden wir rechtliche Massnahmen einleiten.\n\nMit freundlichen Grüßen`
                    });

                    overdueInvoices.push(dunningDocument);
                }
            }
        }

        return Response.json({
            success: true,
            remindersSent: remindersSent.length,
            dunningSent: overdueInvoices.length,
            message: `${remindersSent.length} Zahlungserinnerungen und ${overdueInvoices.length} Mahnungen versendet`
        });
    } catch (error) {
        console.error('Fehler:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});