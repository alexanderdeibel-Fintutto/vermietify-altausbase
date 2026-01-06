import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { documentation_type } = await req.json();

        if (!documentation_type) {
            return Response.json({ error: 'documentation_type erforderlich' }, { status: 400 });
        }

        // Mapping zurück zu bereich
        const bereichMapping = {
            'database_structure': 'database',
            'module_architecture': 'modules',
            'master_data': 'masterdata',
            'business_logic': 'businesslogic',
            'external_integrations': 'integrations',
            'document_generation': 'documents',
            'user_workflows': 'workflows',
            'permissions_roles': 'permissions',
            'error_handling': 'errors',
            'data_migration': 'migration'
        };

        const bereich = bereichMapping[documentation_type];
        if (!bereich) {
            return Response.json({ error: 'Unbekannter documentation_type' }, { status: 400 });
        }

        // Hole alle unverarbeiteten Changes für diesen Bereich
        const changes = await base44.entities.DocumentationChange.filter({
            bereich,
            doku_aktualisiert: false
        });

        // Markiere alle als verarbeitet
        for (const change of changes) {
            await base44.entities.DocumentationChange.update(change.id, {
                doku_aktualisiert: true
            });
        }

        return Response.json({ 
            success: true, 
            processedCount: changes.length 
        });

    } catch (error) {
        console.error('Mark changes as processed error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});