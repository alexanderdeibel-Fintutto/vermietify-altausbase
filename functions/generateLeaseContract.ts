import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const { templateId, tenantId, unitId, contractData } = await req.json();

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Template laden
        const templates = await base44.entities.LeaseTemplate.list();
        const template = templates.find(t => t.id === templateId);
        if (!template) {
            return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404 });
        }

        // Unit & Building laden für Adressen
        const units = await base44.entities.Unit.list();
        const unit = units.find(u => u.id === unitId);
        const buildings = await base44.entities.Building.list();
        const building = buildings.find(b => b.id === unit?.building_id);

        // Template mit Daten füllen
        let content = template.template_content;
        const placeholders = {
            tenant_name: contractData.tenant_name || '',
            tenant_email: contractData.tenant_email || '',
            tenant_phone: contractData.tenant_phone || '',
            rent_amount: contractData.rent_amount || 0,
            currency: 'EUR',
            contract_start: contractData.contract_start || new Date().toISOString().split('T')[0],
            contract_end: contractData.contract_end || '',
            unit_address: `${unit?.street_address || ''}, ${unit?.postal_code || ''} ${unit?.city || ''}`,
            unit_size: unit?.living_area || '',
            landlord_name: user.full_name || user.email,
            building_name: building?.name || '',
            security_deposit: contractData.security_deposit || 0,
            operating_cost_advance: contractData.operating_cost_advance || 0,
            today: new Date().toLocaleDateString('de-DE')
        };

        // Alle Platzhalter ersetzen
        for (const [key, value] of Object.entries(placeholders)) {
            content = content.replace(new RegExp(`{${key}}`, 'g'), value);
        }

        return new Response(JSON.stringify({
            success: true,
            contract_html: content,
            placeholders_filled: placeholders
        }), { status: 200 });

    } catch (error) {
        console.error('Error generating lease:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});