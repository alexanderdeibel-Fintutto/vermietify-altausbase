import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function RolePermissionEditor({
  role,
  onSave,
  isLoading
}) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [permissions, setPermissions] = useState(role?.permissions || {});

  const handlePermissionChange = (resource, action, value) => {
    setPermissions({
      ...permissions,
      [resource]: {
        ...permissions[resource],
        [action]: value
      }
    });
  };

  const handleSave = () => {
    onSave({
      ...role,
      name,
      description,
      permissions
    });
  };

  const resources = [
    {
      key: 'documents',
      label: 'Dokumente',
      actions: ['view', 'create', 'edit', 'delete', 'archive', 'export']
    },
    {
      key: 'tasks',
      label: 'Aufgaben',
      actions: ['view', 'create', 'edit', 'delete', 'assign', 'complete']
    },
    {
      key: 'rules',
      label: 'Regeln',
      actions: ['view', 'create', 'edit', 'delete', 'execute']
    },
    {
      key: 'admin',
      label: 'Administration',
      actions: ['manage_users', 'manage_roles', 'view_analytics', 'manage_settings']
    }
  ];

  const actionLabels = {
    view: 'Anzeigen',
    create: 'Erstellen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    archive: 'Archivieren',
    export: 'Exportieren',
    assign: 'Zuweisen',
    complete: 'Abschließen',
    execute: 'Ausführen',
    manage_users: 'Benutzer verwalten',
    manage_roles: 'Rollen verwalten',
    view_analytics: 'Analytics anzeigen',
    manage_settings: 'Einstellungen verwalten'
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Allgemeine Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Rollenname</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Bearbeiter"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Beschreibung</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie die Rolle..."
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Berechtigungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {resources.map(resource => (
            <div key={resource.key} className="border-b pb-6 last:border-b-0">
              <h4 className="font-medium text-sm text-slate-900 mb-3">{resource.label}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {resource.actions.map(action => (
                  <div key={action} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${resource.key}-${action}`}
                      checked={permissions[resource.key]?.[action] || false}
                      onCheckedChange={(value) =>
                        handlePermissionChange(resource.key, action, value)
                      }
                    />
                    <Label
                      htmlFor={`${resource.key}-${action}`}
                      className="text-xs cursor-pointer font-normal"
                    >
                      {actionLabels[action] || action}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Speichert...' : 'Änderungen speichern'}
      </Button>
    </div>
  );
}