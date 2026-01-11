import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { templateId, action } = await req.json();

        // Rules: Only admins and building managers can edit templates
        const canEdit = user.role === 'admin';
        const canView = user.role === 'admin' || user.role === 'user';

        if (action === 'edit' && !canEdit) {
            return Response.json({ 
                allowed: false, 
                message: 'Nur Administratoren können Templates bearbeiten' 
            }, { status: 403 });
        }

        if (action === 'view' && !canView) {
            return Response.json({ 
                allowed: false, 
                message: 'Zugriff verweigert' 
            }, { status: 403 });
        }

        return Response.json({
            allowed: true,
            role: user.role,
            can_edit: canEdit,
            can_view: canView
        });

    } catch (error) {
        console.error('Permission check error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});