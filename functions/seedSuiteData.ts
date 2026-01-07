import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const result = {
            modules_created: 0,
            suites_created: 0
        };

        // 1. Module erstellen
        const modules = [
            { name: 'accounts', display_name: 'Konten & Banking', category: 'finance', addon_price_tier: 'free' },
            { name: 'property', display_name: 'Immobilienverwaltung', category: 'property', addon_price_tier: 'free' },
            { name: 'tenants', display_name: 'Mieterverwaltung', category: 'property', addon_price_tier: 'free' },
            { name: 'private_tax', display_name: 'Private Steuererklärung', category: 'tax', addon_price_tier: 'basic' },
            { name: 'tax_rental', display_name: 'Vermietung & Steuern', category: 'tax', addon_price_tier: 'basic' },
            { name: 'corporate_tax', display_name: 'Unternehmenssteuern', category: 'tax', addon_price_tier: 'premium' },
            { name: 'corporate_finance', display_name: 'Unternehmensfinanzen', category: 'finance', addon_price_tier: 'premium' },
            { name: 'finance', display_name: 'Finanzmanagement', category: 'finance', addon_price_tier: 'free' },
            { name: 'documents', display_name: 'Dokumentenverwaltung', category: 'documents', addon_price_tier: 'free' },
            { name: 'tasks', display_name: 'Aufgabenverwaltung', category: 'documents', addon_price_tier: 'free' },
            { name: 'communication', display_name: 'Kommunikation', category: 'communication', addon_price_tier: 'basic' },
            { name: 'analytics', display_name: 'Analytics & Reporting', category: 'finance', addon_price_tier: 'premium' }
        ];

        for (const mod of modules) {
            const existing = await base44.entities.ModuleDefinition.filter({ name: mod.name });
            if (existing.length === 0) {
                await base44.entities.ModuleDefinition.create({
                    ...mod,
                    description: `Modul für ${mod.display_name}`,
                    requires_modules: []
                });
                result.modules_created++;
            }
        }

        // 2. Suites erstellen
        const suites = [
            {
                name: 'easyPersonal',
                display_name: 'easyPersonal',
                description: 'Suite für private Finanzverwaltung',
                target_audience: 'Privatpersonen',
                included_modules: ['accounts', 'private_tax', 'documents', 'tasks'],
                price_tier: 'basic',
                active: true
            },
            {
                name: 'easyVermieter',
                display_name: 'easyVermieter',
                description: 'Suite für Vermieter und Immobilienbesitzer',
                target_audience: 'Vermieter',
                included_modules: ['property', 'tenants', 'finance', 'tax_rental', 'documents', 'tasks', 'communication'],
                price_tier: 'professional',
                active: true
            },
            {
                name: 'easyCapital',
                display_name: 'easyCapital',
                description: 'Suite für Unternehmen und Kapitalgesellschaften',
                target_audience: 'Unternehmen',
                included_modules: ['corporate_finance', 'corporate_tax', 'documents', 'tasks', 'analytics'],
                price_tier: 'enterprise',
                active: true
            }
        ];

        for (const suite of suites) {
            const existing = await base44.entities.AppSuite.filter({ name: suite.name });
            if (existing.length === 0) {
                await base44.entities.AppSuite.create(suite);
                result.suites_created++;
            }
        }

        return Response.json({
            success: true,
            ...result,
            message: 'Suite data seeded successfully'
        });

    } catch (error) {
        console.error('Error seeding suite data:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});