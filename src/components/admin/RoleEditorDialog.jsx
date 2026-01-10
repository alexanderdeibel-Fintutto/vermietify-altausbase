import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

export default function RoleEditorDialog({ companyId, role, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    entity_permissions: role?.entity_permissions || {
      document: { view: false, create: false, edit: false, delete: false, archive: false, export: false },
      task: { view: false, create: false, edit: false, delete: false, assign: false, complete: false },
      workflow: { view: false, create: false, edit: false, delete: false, execute: false }
    },
    field_restrictions: role?.field_restrictions || [],
    document_type_restrictions: role?.document_type_restrictions || []
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('manageCustomRole', {
        action: role?.id ? 'update' : 'create',
        role_id: role?.id,
        company_id: companyId,
        ...formData
      }),
    onSuccess: () => {
      onSuccess();
    }
  });

  const togglePermission = (entity, permission) => {
    setFormData({
      ...formData,
      entity_permissions: {
        ...formData.entity_permissions,
        [entity]: {
          ...formData.entity_permissions[entity],
          [permission]: !formData.entity_permissions[entity][permission]
        }
      }
    });
  };

  const entities = ['document', 'task', 'workflow'];
  const permissionLabels = {
    view: 'Ansehen',
    create: 'Erstellen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    assign: 'Zuweisen',
    complete: 'Abschließen',
    archive: 'Archivieren',
    export: 'Exportieren',
    execute: 'Ausführen'
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role?.id ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}</DialogTitle>
          <DialogDescription>
            Definieren Sie Berechtigungen für diese benutzerdefinierte Rolle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div>
            <label className="text-sm font-medium text-slate-700">Rollenname</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Dokumentreviewer"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Beschreibung</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beschreibung der Rolle"
              className="mt-1"
            />
          </div>

          {/* Permissions */}
          <div>
            <h4 className="font-medium text-slate-900 mb-3">Entity-Berechtigungen</h4>
            <div className="space-y-3">
              {entities.map(entity => (
                <Card key={entity} className="bg-slate-50">
                  <CardContent className="pt-4">
                    <h5 className="font-medium text-sm text-slate-900 mb-3 capitalize">
                      {entity === 'document' ? 'Dokumente' : entity === 'task' ? 'Aufgaben' : 'Workflows'}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(formData.entity_permissions[entity] || {}).map(([perm, enabled]) => (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={enabled}
                            onCheckedChange={() => togglePermission(entity, perm)}
                          />
                          <span className="text-sm text-slate-700">{permissionLabels[perm]}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.name || saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}