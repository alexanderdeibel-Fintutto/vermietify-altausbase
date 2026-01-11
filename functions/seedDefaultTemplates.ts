import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { DOCUMENT_TEMPLATES } from '../components/documents/DocumentTemplateLibrary.js';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { building_id } = await req.json();

        console.log('Seeding default templates...');

        const templates = [];

        for (const [docType, html] of Object.entries(DOCUMENT_TEMPLATES)) {
            templates.push({
                document_type: docType,
                template_html: html,
                building_id: building_id || null,
                is_active: true,
                template_fields: extractFields(html)
            });
        }

        const created = await base44.entities.DocumentTemplate.bulkCreate(templates);

        console.log(`Created ${created.length} default templates`);

        return Response.json({
            success: true,
            count: created.length,
            templates: created
        });

    } catch (error) {
        console.error('Error seeding templates:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function extractFields(html) {
    const regex = /{{(\w+)}}/g;
    const fields = [];
    const seen = new Set();
    let match;

    while ((match = regex.exec(html)) !== null) {
        const fieldName = match[1];
        if (!seen.has(fieldName)) {
            seen.add(fieldName);
            fields.push({
                id: `field_${fieldName}`,
                name: fieldName,
                type: guessFieldType(fieldName),
                required: true
            });
        }
    }

    return fields;
}

function guessFieldType(fieldName) {
    if (fieldName.includes('date')) return 'date';
    if (fieldName.includes('amount') || fieldName.includes('rent') || fieldName.includes('cost')) return 'currency';
    if (fieldName.includes('email')) return 'email';
    if (fieldName.includes('phone')) return 'phone';
    if (fieldName.includes('notes') || fieldName.includes('description')) return 'textarea';
    return 'text';
}