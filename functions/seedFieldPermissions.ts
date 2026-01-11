import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const fieldPermissionsToCreate = [
            // Building sensitive fields
            {
                role: 'tenant',
                entity_type: 'Building',
                field_name: 'purchase_price',
                access_level: 'hidden',
                is_sensitive: true,
                description: 'Kaufpreis ist für Mieter verborgen'
            },
            {
                role: 'tenant',
                entity_type: 'Building',
                field_name: 'financing',
                access_level: 'hidden',
                is_sensitive: true,
                description: 'Finanzierungsdaten sind für Mieter verborgen'
            },
            {
                role: 'tenant',
                entity_type: 'Building',
                field_name: 'owner_name',
                access_level: 'hidden',
                is_sensitive: false,
                description: 'Eigentumsname ist für Mieter verborgen'
            },
            {
                role: 'property_manager',
                entity_type: 'Building',
                field_name: 'purchase_price',
                access_level: 'read',
                is_sensitive: true,
                description: 'Kaufpreis - nur Lesezugriff'
            },
            // Invoice financial fields
            {
                role: 'tenant',
                entity_type: 'Invoice',
                field_name: 'total_amount',
                access_level: 'read',
                is_sensitive: false,
                description: 'Mieters können Rechnungsbeträge sehen'
            },
            {
                role: 'property_manager',
                entity_type: 'Invoice',
                field_name: 'payment_method',
                access_level: 'read',
                is_sensitive: false,
                description: 'Zahlungsart - nur Lesezugriff'
            },
            // Lease Contract sensitive fields
            {
                role: 'tenant',
                entity_type: 'LeaseContract',
                field_name: 'deposit',
                access_level: 'read',
                is_sensitive: false,
                description: 'Kaution sichtbar für Mieter'
            },
            {
                role: 'owner',
                entity_type: 'LeaseContract',
                field_name: 'base_rent',
                access_level: 'read',
                is_sensitive: false,
                description: 'Kaltmiete für Eigentümer lesbar'
            }
        ];

        // Get existing field permissions
        const existingPerms = await base44.asServiceRole.entities.FieldPermission.list();
        const existingKeys = new Set(existingPerms.map(p => `${p.role}:${p.entity_type}:${p.field_name}`));

        // Create missing permissions
        const createdPerms = [];
        for (const perm of fieldPermissionsToCreate) {
            const key = `${perm.role}:${perm.entity_type}:${perm.field_name}`;
            if (!existingKeys.has(key)) {
                const created = await base44.asServiceRole.entities.FieldPermission.create(perm);
                createdPerms.push(created);
            }
        }

        return Response.json({
            success: true,
            message: `${createdPerms.length} field permissions created`,
            created_count: createdPerms.length
        });

    } catch (error) {
        console.error('Seed field permissions error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});