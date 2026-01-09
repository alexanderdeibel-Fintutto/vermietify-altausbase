import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, FileText, Edit, Copy, Trash } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentTemplateManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['documentTemplates'],
    queryFn: () => base44.entities.DocumentTemplate.list('-created_date', 100)
  });

  const categoryLabels = {
    lease_contract: '📄 Mietvertrag',
    termination: '📋 Kündigung',
    rent_increase: '💰 Mieterhöhung',
    confirmation: '✅ Bestätigung',
    reminder: '⏰ Mahnung',
    general: '📝 Allgemein'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-light">Dokumentvorlagen</h2>
        <Button onClick={() => { setEditingTemplate(null); setShowForm(true); }} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Neue Vorlage
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{template.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {categoryLabels[template.category]}
                  </p>
                  {template.description && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{template.description}</p>
                  )}
                </div>
                {template.is_default && (
                  <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
                )}
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button size="sm" variant="outline" onClick={() => { setEditingTemplate(template); setShowForm(true); }} className="flex-1">
                  <Edit className="w-3 h-3 mr-1" />
                  Bearbeiten
                </Button>
                <Button size="sm" variant="outline">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>

              {template.usage_count > 0 && (
                <p className="text-xs text-slate-500 mt-2">{template.usage_count}x verwendet</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <TemplateFormDialog
          template={editingTemplate}
          onClose={() => { setShowForm(false); setEditingTemplate(null); }}
        />
      )}
    </div>
  );
}

function TemplateFormDialog({ template, onClose }) {
  const [formData, setFormData] = useState(template || {
    name: '',
    description: '',
    category: 'general',
    content: '',
    is_active: true,
    is_default: false
  });
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      if (template?.id) {
        return await base44.entities.DocumentTemplate.update(template.id, data);
      } else {
        return await base44.entities.DocumentTemplate.create({ ...data, created_by: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTemplates'] });
      toast.success('Vorlage gespeichert');
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>{template ? 'Vorlage bearbeiten' : 'Neue Vorlage'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <Label>Kategorie</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lease_contract">Mietvertrag</SelectItem>
                <SelectItem value="termination">Kündigung</SelectItem>
                <SelectItem value="rent_increase">Mieterhöhung</SelectItem>
                <SelectItem value="confirmation">Bestätigung</SelectItem>
                <SelectItem value="reminder">Mahnung</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Vorlageninhalt</Label>
            <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={12} className="font-mono text-sm" />
            <p className="text-xs text-slate-600 mt-1">Verwenden Sie Platzhalter wie {`{{tenant_name}}`}, {`{{address}}`}, {`{{date}}`}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}>
              Speichern
            </Button>
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}