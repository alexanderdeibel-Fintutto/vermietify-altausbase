import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Test-Daten Generator
 * Admin-Only: Generiert umfangreiche Test-Daten für alle Szenarien
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { scenario, count = 10 } = await req.json();

        const results = {
            workflows_created: 0,
            tasks_created: 0,
            emails_created: 0,
            automations_created: 0
        };

        // Szenario 1: Standard Test-Workflows
        if (scenario === 'workflows' || scenario === 'all') {
            const testWorkflows = [
                {
                    name: "Standard Mietvertrag",
                    description: "Workflow für neue Mietverträge mit allen Schritten",
                    document_type: "Mietvertrag",
                    is_default: true,
                    is_active: true
                },
                {
                    name: "Mahnung Workflow",
                    description: "Automatisierter Mahnprozess in 3 Stufen",
                    document_type: "Mahnung",
                    is_default: true,
                    is_active: true
                },
                {
                    name: "Kündigung Workflow",
                    description: "Kündigungsbearbeitung mit Fristen und Übergabe",
                    document_type: "Kündigung",
                    is_default: true,
                    is_active: true
                },
                {
                    name: "Mängelbeseitigung Express",
                    description: "Schnellverfahren für dringende Reparaturen",
                    document_type: "Mängelmeldung",
                    is_default: false,
                    is_active: true
                },
                {
                    name: "Betriebskosten Jahresabrechnung",
                    description: "Vollständiger Prozess für NK-Abrechnung",
                    document_type: "Betriebskosten",
                    is_default: false,
                    is_active: true
                }
            ];

            for (const workflow of testWorkflows) {
                const existing = await base44.entities.Workflow.filter({ name: workflow.name });
                if (existing.length === 0) {
                    await base44.asServiceRole.entities.Workflow.create(workflow);
                    results.workflows_created++;
                }
            }
        }

        // Szenario 2: Realistische Tasks für verschiedene Status
        if (scenario === 'tasks' || scenario === 'all') {
            const priorities = await base44.entities.TaskPriority.list();
            const workflows = await base44.entities.Workflow.list();
            const buildings = await base44.entities.Building.list();

            if (priorities.length === 0 || workflows.length === 0) {
                return Response.json({
                    error: 'Bitte zuerst Prioritäten und Workflows erstellen'
                }, { status: 400 });
            }

            const statuses = ['offen', 'in_bearbeitung', 'wartend', 'erledigt', 'abgebrochen'];
            const taskTemplates = [
                { title: "Mietvertrag für neue Wohnung erstellen", description: "Standardmietvertrag vorbereiten und versenden" },
                { title: "Heizung Wohnung 3.2 reparieren", description: "Heizungsausfall beheben, Handwerker beauftragen" },
                { title: "Nebenkostenabrechnung 2025 erstellen", description: "Jährliche Betriebskostenabrechnung" },
                { title: "Mahnung wegen Mietrückstand", description: "Erste Mahnung versenden" },
                { title: "Übergabeprotokoll Wohnung 1.5", description: "Protokoll bei Auszug erstellen" },
                { title: "Wasserschaden Erdgeschoss dokumentieren", description: "Schaden aufnehmen und Versicherung informieren" },
                { title: "Rauchmelder-Wartung Gebäude A", description: "Jährliche Wartung durchführen" },
                { title: "Kündigungsbestätigung versenden", description: "Kündigung bestätigen und Übergabetermin vereinbaren" }
            ];

            for (let i = 0; i < Math.min(count, taskTemplates.length); i++) {
                const template = taskTemplates[i % taskTemplates.length];
                const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
                const randomWorkflow = workflows[Math.floor(Math.random() * workflows.length)];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                const randomBuilding = buildings.length > 0 ? buildings[Math.floor(Math.random() * buildings.length)] : null;

                const daysOffset = Math.floor(Math.random() * 14) - 7; // -7 bis +7 Tage
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + daysOffset);

                await base44.asServiceRole.entities.Task.create({
                    title: `${template.title} #${i + 1}`,
                    description: template.description,
                    status: randomStatus,
                    priority_id: randomPriority.id,
                    workflow_id: randomWorkflow.id,
                    assigned_object_id: randomBuilding?.id,
                    due_date: dueDate.toISOString(),
                    completed_at: randomStatus === 'erledigt' ? new Date().toISOString() : null,
                    is_automated: Math.random() > 0.7
                });

                results.tasks_created++;
            }
        }

        // Szenario 3: Test-Emails
        if (scenario === 'emails' || scenario === 'all') {
            const emailTemplates = [
                {
                    subject: "Heizung defekt - Dringend!",
                    sender_email: "mieter@example.com",
                    sender_name: "Max Mustermann",
                    body_text: "Seit gestern funktioniert die Heizung nicht mehr. Es ist sehr kalt in der Wohnung."
                },
                {
                    subject: "Anfrage: Neue Mieterin für Wohnung 2.3",
                    sender_email: "makler@example.com",
                    sender_name: "Immobilien Makler GmbH",
                    body_text: "Ich habe eine interessierte Mieterin für die Wohnung in der Hauptstraße 15."
                },
                {
                    subject: "Wasserschaden im Bad",
                    sender_email: "bewohner@example.com",
                    sender_name: "Anna Schmidt",
                    body_text: "Es tropft vom Badezimmer der oberen Wohnung. Bitte dringend prüfen!"
                }
            ];

            for (let i = 0; i < Math.min(count, 20); i++) {
                const template = emailTemplates[i % emailTemplates.length];
                const receivedDate = new Date();
                receivedDate.setDate(receivedDate.getDate() - Math.floor(Math.random() * 7));

                await base44.asServiceRole.entities.Email.create({
                    ...template,
                    received_date: receivedDate.toISOString(),
                    has_task: false,
                    is_processed: Math.random() > 0.5
                });

                results.emails_created++;
            }
        }

        // Szenario 4: Test-Automatisierungen
        if (scenario === 'automations' || scenario === 'all') {
            const testAutomations = [
                {
                    name: "Test: Tägliche Task-Prüfung",
                    description: "Prüft täglich alle fälligen Tasks",
                    trigger_type: "time_based",
                    trigger_config: { schedule: "daily", time: "07:00" },
                    action_type: "send_email",
                    action_config: { template: "daily_summary" },
                    is_active: false
                },
                {
                    name: "Test: Auto-Task bei Status-Änderung",
                    description: "Erstellt Task wenn Dokument auf 'unterschrieben' gesetzt wird",
                    trigger_type: "status_change",
                    trigger_config: { entity: "Document", field: "status", value: "unterschrieben" },
                    action_type: "create_task",
                    action_config: { title: "Dokument archivieren", priority: "normal" },
                    is_active: false
                }
            ];

            for (const automation of testAutomations) {
                const existing = await base44.entities.Automation.filter({ name: automation.name });
                if (existing.length === 0) {
                    await base44.asServiceRole.entities.Automation.create(automation);
                    results.automations_created++;
                }
            }
        }

        return Response.json({
            success: true,
            message: 'Test-Daten erfolgreich generiert',
            results
        });

    } catch (error) {
        console.error('Test data generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});