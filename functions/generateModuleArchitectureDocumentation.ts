import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Sammle alle relevanten Entities für die Architektur-Dokumentation
        const entities = [
            'ModuleDefinition',
            'ModuleAccess',
            'UserModuleAccess',
            'ModulePricing',
            'SubscriptionPlan',
            'UserSubscription',
            'Feature',
            'FeatureGroup'
        ];

        const entityData = {};
        for (const entityName of entities) {
            try {
                const records = await base44.asServiceRole.entities[entityName].list();
                entityData[entityName] = records || [];
            } catch (error) {
                entityData[entityName] = [];
            }
        }

        const prompt = `
Erstelle eine detaillierte Modul-Architektur-Dokumentation für das vermitify-System.

**Vorhandene Daten:**

${Object.entries(entityData).map(([entity, records]) => `
**${entity}:**
${records.length > 0 ? JSON.stringify(records, null, 2) : 'Keine Daten vorhanden'}
`).join('\n')}

**Aufgabe:**
Erstelle eine umfassende Dokumentation, die folgendes abdeckt:

1. **Modul-Übersicht**: Alle verfügbaren Module und deren Zweck
2. **Architektur-Diagramm**: Textuelle Beschreibung der Beziehungen zwischen Modulen
3. **Zugriffs-Modell**: Wie werden Module freigeschaltet und verwaltet?
4. **Preismodell-Integration**: Wie hängen Module mit Abonnements zusammen?
5. **Datenfluss**: Wie werden Berechtigungen geprüft und durchgesetzt?
6. **Best Practices**: Empfehlungen für die Modul-Verwaltung

Formatiere die Dokumentation in klarem, strukturiertem Markdown.
`;

        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false
        });

        // Speichere die generierte Dokumentation
        const doc = await base44.asServiceRole.entities.GeneratedDocumentation.create({
            title: 'Modul-Architektur',
            category: 'ARCHITECTURE',
            content: result,
            generated_date: new Date().toISOString()
        });

        return Response.json({
            success: true,
            documentation_id: doc.id,
            content: result
        });

    } catch (error) {
        console.error('Error generating module architecture documentation:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});