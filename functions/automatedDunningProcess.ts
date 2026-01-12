import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Automated dunning (Mahnung) process
 * - Checks for overdue payments
 * - Creates communication workflow reminders
 * - Sends notifications via CommunicationWorkflow
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { buildingId, daysOverdue = 14 } = await req.json();

        // Find all unpaid invoices older than daysOverdue
        const today = new Date();
        const overdueDate = new Date(today.getTime() - daysOverdue * 24 * 60 * 60 * 1000);

        const unpaidInvoices = await base44.entities.Invoice.list(
            'due_date',
            1000,
            {
                status: 'UNPAID',
                due_date: { $lte: overdueDate.toISOString().split('T')[0] },
                ...(buildingId && { building_id: buildingId })
            }
        );

        console.log(`Found ${unpaidInvoices?.length || 0} overdue invoices`);

        if (!unpaidInvoices?.length) {
            return Response.json({ processed: 0, dunnings: [] });
        }

        const dunnings = [];

        for (const invoice of unpaidInvoices) {
            // Get tenant info
            const tenants = await base44.entities.Tenant.list('-updated_date', 1, { id: invoice.tenant_id });
            if (!tenants?.length) continue;

            const tenant = tenants[0];
            const daysOverdueAmount = Math.floor(
                (today.getTime() - new Date(invoice.due_date).getTime()) / (24 * 60 * 60 * 1000)
            );

            // Create communication workflow execution (for email/SMS)
            const workflow = await base44.entities.CommunicationWorkflow.list(
                '-updated_date',
                1,
                { workflow_type: 'Mietzahlungserinnerung' }
            );

            if (workflow?.length) {
                // Log communication
                await base44.entities.CommunicationLog.create({
                    workflow_id: workflow[0].id,
                    tenant_id: tenant.id,
                    contract_id: invoice.contract_id,
                    kommunikationstyp: 'E-Mail',
                    empfaenger_email: tenant.email,
                    betreff: `Zahlungserinnerung: Rechnung ${invoice.invoice_number} (${daysOverdueAmount} Tage überfällig)`,
                    nachricht: `Sehr geehrte/r ${tenant.full_name},\n\nwir möchten Sie höflich darauf hinweisen, dass die Rechnung ${invoice.invoice_number} vom ${invoice.issue_date} in Höhe von ${invoice.amount}€ noch nicht bezahlt wurde.\n\nZahlbar bis: ${invoice.due_date}\nÜberfällig seit: ${daysOverdueAmount} Tagen\n\nBitte überweisen Sie den Betrag umgehend.\n\nMit freundlichen Grüßen`,
                    versand_status: 'Versendet'
                });

                dunnings.push({
                    invoiceId: invoice.id,
                    tenantId: tenant.id,
                    amount: invoice.amount,
                    daysOverdue: daysOverdueAmount,
                    email: tenant.email,
                    status: 'sent'
                });
            }
        }

        return Response.json({
            processed: dunnings.length,
            dunnings: dunnings
        });

    } catch (error) {
        console.error('Error in dunning process:', error.message);
        return Response.json({
            error: error.message
        }, { status: 500 });
    }
});