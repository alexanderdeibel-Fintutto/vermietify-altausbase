import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { company_id } = await req.json();

    const defaultRoles = [
      {
        company_id,
        name: 'workflow_admin',
        display_name: 'Workflow Admin',
        description: 'Vollständige Kontrolle über Workflows und deren Konfiguration',
        is_default: true,
        is_custom: false,
        permissions: {
          view: true,
          execute: true,
          edit: true,
          delete: true,
          manage_permissions: true,
          manage_templates: true,
          view_analytics: true,
          approve: true
        }
      },
      {
        company_id,
        name: 'workflow_user',
        display_name: 'Workflow User',
        description: 'Kann Workflows ausführen und Templates erstellen',
        is_default: true,
        is_custom: false,
        permissions: {
          view: true,
          execute: true,
          edit: false,
          delete: false,
          manage_permissions: false,
          manage_templates: true,
          view_analytics: true,
          approve: false
        }
      },
      {
        company_id,
        name: 'workflow_approver',
        display_name: 'Workflow Approver',
        description: 'Kann Workflow-Approvals durchführen',
        is_default: true,
        is_custom: false,
        permissions: {
          view: true,
          execute: false,
          edit: false,
          delete: false,
          manage_permissions: false,
          manage_templates: false,
          view_analytics: true,
          approve: true
        }
      },
      {
        company_id,
        name: 'workflow_viewer',
        display_name: 'Workflow Viewer',
        description: 'Kann Workflows und Analytics nur anzeigen',
        is_default: true,
        is_custom: false,
        permissions: {
          view: true,
          execute: false,
          edit: false,
          delete: false,
          manage_permissions: false,
          manage_templates: false,
          view_analytics: true,
          approve: false
        }
      }
    ];

    const results = [];
    for (const role of defaultRoles) {
      try {
        const result = await base44.asServiceRole.entities.WorkflowRole.create(role);
        results.push(result);
      } catch (error) {
        if (!error.message.includes('duplicate')) {
          throw error;
        }
      }
    }

    return Response.json({
      success: true,
      roles_initialized: results.length,
      roles: results
    });
  } catch (error) {
    console.error('Initialize workflow roles error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});