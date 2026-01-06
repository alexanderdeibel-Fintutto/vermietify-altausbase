import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { step, action } = await req.json();

        // Step 1: Standard-Workflows und Prioritäten
        if (step === 1 && action === 'import') {
            // Prüfen ob bereits vorhanden
            const existingPriorities = await base44.entities.TaskPriority.list();
            const existingWorkflows = await base44.entities.Workflow.list();

            let prioritiesCreated = 0;
            let workflowsCreated = 0;

            if (existingPriorities.length === 0) {
                await base44.asServiceRole.entities.TaskPriority.bulkCreate([
                    { name: "Niedrig", color_code: "#3B82F6", sort_order: 1, default_due_days: 14, is_active: true },
                    { name: "Normal", color_code: "#10B981", sort_order: 2, default_due_days: 7, is_active: true },
                    { name: "Hoch", color_code: "#F59E0B", sort_order: 3, default_due_days: 3, is_active: true },
                    { name: "Dringend", color_code: "#EF4444", sort_order: 4, default_due_days: 1, is_active: true }
                ]);
                prioritiesCreated = 4;
            }

            if (existingWorkflows.length === 0) {
                await base44.asServiceRole.entities.Workflow.bulkCreate([
                    { name: "Mieterwechsel", description: "Standard-Workflow für Mieterwechsel", document_type: "Mietvertrag", is_default: true, is_active: true },
                    { name: "Mängelbeseitigung", description: "Workflow für Reparaturen und Mängel", document_type: "Mängelmeldung", is_default: false, is_active: true },
                    { name: "Mieterhöhung", description: "Workflow für Mietanpassungen", document_type: "Mieterhöhung", is_default: false, is_active: true },
                    { name: "Nebenkostenabrechnung", description: "Workflow für jährliche NK-Abrechnung", document_type: "Betriebskosten", is_default: false, is_active: true }
                ]);
                workflowsCreated = 4;
            }

            return Response.json({
                success: true,
                message: `${prioritiesCreated} Prioritäten und ${workflowsCreated} Workflows erstellt`
            });
        }

        // Step 3: Standard-Automatisierungen aktivieren
        if (step === 3 && action === 'activate') {
            const existingAutomations = await base44.entities.Automation.list();

            if (existingAutomations.length === 0) {
                await base44.asServiceRole.entities.Automation.bulkCreate([
                    {
                        name: "Automatische Erinnerung für fällige Tasks",
                        description: "Erstellt täglich Benachrichtigungen für Tasks, die heute fällig sind",
                        trigger_type: "time_based",
                        trigger_config: { schedule: "daily", time: "08:00" },
                        action_type: "send_email",
                        action_config: { subject: "Fällige Tasks heute", template: "task_reminder" },
                        is_active: true
                    },
                    {
                        name: "Task bei Vertragsabschluss",
                        description: "Erstellt automatisch einen Task bei neuem Mietvertrag",
                        trigger_type: "status_change",
                        trigger_config: { entity: "LeaseContract", status_field: "status", status_value: "active" },
                        action_type: "create_task",
                        action_config: { title: "Übergabeprotokoll erstellen", priority: "hoch", due_days: 3 },
                        is_active: true
                    }
                ]);

                return Response.json({
                    success: true,
                    message: '2 Standard-Automatisierungen aktiviert'
                });
            }

            return Response.json({
                success: true,
                message: 'Automatisierungen bereits vorhanden'
            });
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('Task system initialization error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});