import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            document_type,
            tenant_id,
            contract_id,
            unit_id,
            building_id,
            document_data,
            distribution_channels = ['email'],
            create_task = true,
            task_category = 'allgemein_verwaltung',
            task_type = 'dokument_versendet'
        } = await req.json();

        console.log(`Orchestrating document workflow: ${document_type}`);

        // Step 1: Generate document
        const generateResult = await base44.functions.invoke('generateDocument', {
            document_type,
            tenant_id,
            contract_id,
            unit_id,
            building_id,
            document_data
        });

        if (!generateResult.success) {
            return Response.json({ error: 'Document generation failed' }, { status: 500 });
        }

        const document_id = generateResult.document_id;

        // Step 2: Distribute document
        const distributeResult = await base44.functions.invoke('distributeDocument', {
            document_id,
            tenant_id,
            channels: distribution_channels,
            auto_select: distribution_channels.length === 0
        });

        // Step 3: Create task if requested
        let task_id = null;
        if (create_task) {
            try {
                const task = await base44.entities.FieldTask.create({
                    task_category,
                    task_type,
                    title: `Dokument versendet: ${document_type}`,
                    description: `${document_type} wurde an ${tenant_id} versendet via ${distribution_channels.join(', ')}`,
                    building_id,
                    unit_id,
                    tenant_id,
                    contract_id,
                    status: 'erledigt',
                    priority: 'normal',
                    completed_date: new Date().toISOString(),
                    created_via: 'automation'
                });
                task_id = task.id;
            } catch (e) {
                console.warn('Task creation failed:', e);
            }
        }

        // Step 4: Create reminder tasks for follow-ups
        let follow_up_tasks = [];
        
        if (['zahlungserinnerung', 'mahnung'].includes(document_type)) {
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + 14); // 14 days later
            try {
                const followUpTask = await base44.entities.FieldTask.create({
                    task_category: 'allgemein_verwaltung',
                    task_type: 'zahlungseingang_pruefen',
                    title: `Zahlungseingang prüfen: ${document_type}`,
                    description: `Prüfe, ob Zahlung für ${document_type} eingegangen ist`,
                    building_id,
                    unit_id,
                    tenant_id,
                    contract_id,
                    status: 'offen',
                    priority: 'normal',
                    scheduled_date: followUpDate.toISOString(),
                    created_via: 'automation'
                });
                follow_up_tasks.push(followUpTask.id);
            } catch (e) {
                console.warn('Follow-up task creation failed:', e);
            }
        }

        console.log(`Document workflow completed: ${document_id}`);

        return Response.json({
            success: true,
            document_id,
            task_id,
            follow_up_tasks,
            distribution_results: distributeResult.results
        });

    } catch (error) {
        console.error('Error orchestrating document:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});