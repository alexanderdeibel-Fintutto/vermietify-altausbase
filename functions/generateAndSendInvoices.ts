import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const contracts = await base44.entities.LeaseContract.filter({ status: 'active' });
        const generatedInvoices = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        for (const contract of contracts) {
            // Prüfe ob bereits Rechnung diesen Monat existiert
            const existingInvoices = await base44.entities.GeneratedDocument.filter({
                contract_id: contract.id,
                document_type: 'rechnung'
            });

            const monthExists = existingInvoices.some(inv => {
                const invDate = new Date(inv.created_date);
                return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
            });

            if (monthExists) continue;

            // Hole Tenant und Unit Daten
            const tenant = await base44.entities.Tenant.filter({ id: contract.tenant_id });
            const unit = await base44.entities.Unit.filter({ id: contract.unit_id });

            if (!tenant || !unit) continue;

            const amount = contract.total_rent || (contract.base_rent + (contract.utilities || 0) + (contract.heating || 0));
            const dueDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

            const invoiceData = {
                document_type: 'mietvertrag',
                contract_id: contract.id,
                tenant_id: contract.tenant_id,
                unit_id: contract.unit_id,
                building_id: contract.unit_id,
                pdf_url: null,
                document_data: {
                    invoiceNumber: `REC-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${contract.id.substring(0, 6)}`,
                    issueDate: today.toISOString().split('T')[0],
                    dueDate: dueDate.toISOString().split('T')[0],
                    amount: amount,
                    baseRent: contract.base_rent || 0,
                    utilities: contract.utilities || 0,
                    heating: contract.heating || 0,
                    description: `Miete ${new Date(currentYear, currentMonth).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`
                },
                distribution_status: 'generated',
                signature_requested: false
            };

            const createdInvoice = await base44.entities.GeneratedDocument.create(invoiceData);
            
            // Erstelle Payment-Reminder-Task
            await base44.entities.Task.create({
                title: `Zahlungserinnerung fällig - ${tenant[0]?.first_name} ${tenant[0]?.last_name}`,
                description: `Rechnung ${invoiceData.document_data.invoiceNumber} - Betrag: ${amount}€ - Fällig: ${dueDate.toLocaleDateString('de-DE')}`,
                status: 'offen',
                due_date: dueDate.toISOString(),
                assigned_tenant_id: contract.tenant_id
            });

            generatedInvoices.push(createdInvoice);
        }

        return Response.json({
            success: true,
            invoicesGenerated: generatedInvoices.length,
            message: `${generatedInvoices.length} Rechnungen erstellt und Zahlungserinnerungen geplant`
        });
    } catch (error) {
        console.error('Fehler:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});