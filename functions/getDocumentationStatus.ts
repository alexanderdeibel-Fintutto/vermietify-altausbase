import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Hole alle Dokumentationen
        const documentations = await base44.entities.GeneratedDocumentation.list('-last_generated_at');

        // Hole alle unverarbeiteten Changes
        const unprocessedChanges = await base44.entities.DocumentationChange.filter({
            doku_aktualisiert: false
        });

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

        const status = {};

        for (const [bereich, docType] of Object.entries(bereichMapping)) {
            const doc = documentations.find(d => d.documentation_type === docType);
            const changes = unprocessedChanges.filter(c => c.bereich === bereich);

            if (!doc) {
                status[docType] = {
                    status: 'nicht_vorhanden',
                    badge: '❌',
                    color: 'red',
                    changes: changes.length,
                    changeDetails: changes
                };
            } else if (changes.length > 0) {
                status[docType] = {
                    status: 'veraltet',
                    badge: '⚠️',
                    color: 'yellow',
                    changes: changes.length,
                    changeDetails: changes,
                    lastGenerated: doc.last_generated_at
                };
            } else {
                // Prüfe ob älter als 7 Tage
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const lastGen = new Date(doc.last_generated_at);
                
                if (lastGen < sevenDaysAgo) {
                    status[docType] = {
                        status: 'alt',
                        badge: '🕐',
                        color: 'orange',
                        changes: 0,
                        lastGenerated: doc.last_generated_at
                    };
                } else {
                    status[docType] = {
                        status: 'aktuell',
                        badge: '✅',
                        color: 'green',
                        changes: 0,
                        lastGenerated: doc.last_generated_at
                    };
                }
            }
        }

        // Zähle veraltete Dokumentationen
        const outdatedCount = Object.values(status).filter(s => 
            s.status === 'veraltet' || s.status === 'nicht_vorhanden'
        ).length;

        return Response.json({ 
            status,
            outdatedCount,
            totalChanges: unprocessedChanges.length
        });

    } catch (error) {
        console.error('Get documentation status error:', error);
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});