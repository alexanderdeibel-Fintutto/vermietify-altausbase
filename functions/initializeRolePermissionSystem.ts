import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { company_id } = await req.json();

    // Define default roles
    const defaultRoles = [
      {
        name: 'Administrator',
        description: 'Vollständiger Zugriff auf alle Funktionen',
        is_system: true,
        company_id: company_id,
        permissions: {
          documents: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            archive: true,
            export: true
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            assign: true,
            complete: true
          },
          rules: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            execute: true
          },
          admin: {
            manage_users: true,
            manage_roles: true,
            view_analytics: true,
            manage_settings: true
          }
        }
      },
      {
        name: 'Bearbeiter',
        description: 'Kann Dokumente und Aufgaben erstellen und bearbeiten',
        is_system: true,
        company_id: company_id,
        permissions: {
          documents: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            archive: false,
            export: true
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            assign: true,
            complete: true
          },
          rules: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            execute: false
          },
          admin: {
            manage_users: false,
            manage_roles: false,
            view_analytics: true,
            manage_settings: false
          }
        }
      },
      {
        name: 'Leser',
        description: 'Kann Dokumente und Aufgaben nur anschauen',
        is_system: true,
        company_id: company_id,
        permissions: {
          documents: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            archive: false,
            export: false
          },
          tasks: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            assign: false,
            complete: false
          },
          rules: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            execute: false
          },
          admin: {
            manage_users: false,
            manage_roles: false,
            view_analytics: false,
            manage_settings: false
          }
        }
      }
    ];

    // Create roles
    const createdRoles = [];
    for (const roleData of defaultRoles) {
      const existingRole = await base44.asServiceRole.entities.UserRole.filter({
        name: roleData.name,
        company_id: company_id
      });

      if (existingRole.length === 0) {
        const created = await base44.asServiceRole.entities.UserRole.create(roleData);
        createdRoles.push(created);
      } else {
        createdRoles.push(existingRole[0]);
      }
    }

    return Response.json({
      success: true,
      roles_created: createdRoles.length,
      roles: createdRoles.map(r => ({ id: r.id, name: r.name }))
    });
  } catch (error) {
    console.error('Initialize role system error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});