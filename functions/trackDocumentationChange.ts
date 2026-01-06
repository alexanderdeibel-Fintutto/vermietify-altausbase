import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { bereich, aenderung_typ, aenderung_beschreibung, betroffene_entitaet, change_details } = await req.json();

        if (!bereich || !aenderung_typ || !aenderung_beschreibung) {
            return Response.json({ error: 'bereich, aenderung_typ und aenderung_beschreibung sind erforderlich' }, { status: 400 });
        }

        // Change tracken
        const change = await base44.entities.DocumentationChange.create({
            bereich,
            aenderung_typ,
            aenderung_beschreibung,
            betroffene_entitaet,
            aenderung_zeitpunkt: new Date().toISOString(),
            verursacher_email: user.email,
            doku_aktualisiert: false,
            change_details: change_details || {}
        });

        // Benachrichtigung erstellen wenn Doku veraltet ist
        const bereichMapping = {
            'database': 'database_structure',
            'modules': 'module_architecture',
            'masterdata': 'master_data',
            'businesslogic': 'business_logic',
            'integrations': 'external_integrations',
            'documents': 'document_generation',
            'workflows': 'user_workflows',
            'permissions': 'permissions_roles',
            'errors': 'error_handling',
            'migration': 'data_migration'
        };

        const docType = bereichMapping[bereich];
        if (docType) {
            const existingDocs = await base44.entities.GeneratedDocumentation.filter({
                documentation_type: docType,
                status: 'completed'
            });

            if (existingDocs.length > 0) {
                // Erstelle Notification für Admins
                await base44.asServiceRole.entities.Notification.create({
                    type: 'warning',
                    title: 'Dokumentation veraltet',
                    message: `Die Dokumentation "${existingDocs[0].title}" ist durch eine Änderung veraltet: ${aenderung_beschreibung}`,
                    action_url: '/DeveloperDocumentation',
                    is_read: false
                });
            }
        }

        return Response.json({ 
            success: true, 
            change_id: change.id 
        });

    } catch (error) {
        console.error('Track documentation change error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});