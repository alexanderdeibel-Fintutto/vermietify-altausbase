import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

export default function WorkflowRuleBuilder({ companyId, onSuccess }) {
  const [step, setStep] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'document_created',
    conditions: {
      document_type: [],
      tags: [],
      age_days: null,
      metadata_conditions: []
    },
    actions: []
  });

  const [newDocType, setNewDocType] = useState('');
  const [newTag, setNewTag] = useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createWorkflowRule', {
        company_id: companyId,
        ...formData
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules', companyId] });
      setFormData({
        name: '',
        description: '',
        trigger_type: 'document_created',
        conditions: { document_type: [], tags: [], age_days: null, metadata_conditions: [] },
        actions: []
      });
      setStep('basic');
      onSuccess?.();
    }
  });

  const addDocumentType = () => {
    if (newDocType) {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          document_type: [...prev.conditions.document_type, newDocType]
        }
      }));
      setNewDocType('');
    }
  };

  const removeDocumentType = (type) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        document_type: prev.conditions.document_type.filter(t => t !== type)
      }
    }));
  };

  const addTag = () => {
    if (newTag) {
      setFormData(prev => ({
        ...prev,
        conditions: {
          ...prev.conditions,
          tags: [...prev.conditions.tags, newTag]
        }
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        tags: prev.conditions.tags.filter(t => t !== tag)
      }
    }));
  };

  const addAction = (actionType, parameters = {}) => {
    setFormData(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          action_type: actionType,
          parameters,
          order: prev.actions.length
        }
      ]
    }));
  };

  const removeAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Neue Regel erstellen</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workflow-Regel erstellen</DialogTitle>
        </DialogHeader>

        <Tabs value={step} onValueChange={setStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Grundlagen</TabsTrigger>
            <TabsTrigger value="conditions">Bedingungen</TabsTrigger>
            <TabsTrigger value="actions">Aktionen</TabsTrigger>
          </TabsList>

          {/* Basic Step */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Regelname</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Verträge an Rechtsabteilung"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Beschreibung</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trigger-Typ</label>
              <Select value={formData.trigger_type} onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="document_created">Bei Dokumenterstellung</SelectItem>
                  <SelectItem value="scheduled">Zeitgesteuert</SelectItem>
                  <SelectItem value="manual">Manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Conditions Step */}
          <TabsContent value="conditions" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dokumenttypen</label>
                <div className="flex gap-2">
                  <Input
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    placeholder="z.B. contract"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addDocumentType();
                      }
                    }}
                  />
                  <Button size="sm" onClick={addDocumentType}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.conditions.document_type.map((type) => (
                    <Badge key={type} className="flex items-center gap-2 bg-blue-100 text-blue-700">
                      {type}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeDocumentType(type)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="z.B. urgent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag();
                      }
                    }}
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.conditions.tags.map((tag) => (
                    <Badge key={tag} className="flex items-center gap-2 bg-purple-100 text-purple-700">
                      {tag}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dokumentalter (Tage)</label>
                <Input
                  type="number"
                  value={formData.conditions.age_days || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    conditions: { ...formData.conditions, age_days: e.target.value ? Number(e.target.value) : null }
                  })}
                  placeholder="z.B. 1825 (5 Jahre)"
                />
              </div>
            </div>
          </TabsContent>

          {/* Actions Step */}
          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => addAction('create_task', {
                  title: 'Aufgabe überprüfen',
                  task_type: 'review',
                  assigned_to: ''
                })}
              >
                + Aufgabe erstellen
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => addAction('archive', {
                  reason: 'completed',
                  notes: ''
                })}
              >
                + Archivieren
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => addAction('add_tag', {
                  tags: []
                })}
              >
                + Tag hinzufügen
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => addAction('send_notification', {
                  channel: '#documents',
                  message: ''
                })}
              >
                + Benachrichtigung senden
              </Button>
            </div>

            {formData.actions.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium">Aktionen</label>
                {formData.actions.map((action, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-start">
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">{action.action_type}</p>
                      <p className="text-xs text-slate-600">{JSON.stringify(action.parameters).substring(0, 50)}...</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAction(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline">Abbrechen</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !formData.name || formData.actions.length === 0}
          >
            Regel erstellen
          </Button>
        </div>

        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-900">{createMutation.error.message}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}