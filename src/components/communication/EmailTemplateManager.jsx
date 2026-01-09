import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function EmailTemplateManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.CommunicationTemplate.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CommunicationTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('Vorlage erstellt');
      setShowDialog(false);
      setEditingTemplate(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CommunicationTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('Vorlage aktualisiert');
      setShowDialog(false);
      setEditingTemplate(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CommunicationTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      toast.success('Vorlage gelöscht');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light">E-Mail-Vorlagen</h2>
        <Button onClick={() => { setEditingTemplate(null); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Vorlage
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.template_name}</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{template.category}</p>
                </div>
                <Badge className={template.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                  {template.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 mb-1">Betreff</p>
                <p className="text-sm font-semibold">{template.subject}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Vorschau</p>
                <p className="text-xs text-slate-700 line-clamp-3">{template.body}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <p className="text-xs text-slate-500">{template.usage_count || 0}x verwendet</p>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditingTemplate(template); setShowDialog(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(template.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showDialog && (
        <TemplateDialog
          template={editingTemplate}
          onClose={() => { setShowDialog(false); setEditingTemplate(null); }}
          onCreate={(data) => createMutation.mutate(data)}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        />
      )}
    </div>
  );
}

function TemplateDialog({ template, onClose, onCreate, onUpdate }) {
  const [formData, setFormData] = useState(template || {
    template_name: '',
    category: 'general',
    subject: '',
    body: '',
    variables: ['{{tenant_name}}', '{{amount}}', '{{date}}'],
    is_active: true
  });

  const handleSave = () => {
    if (!formData.template_name || !formData.subject || !formData.body) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    if (template?.id) {
      onUpdate(template.id, formData);
    } else {
      onCreate({ ...formData, created_at: new Date().toISOString() });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Vorlage bearbeiten' : 'Neue Vorlage'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vorlagenname</Label>
              <Input
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                placeholder="z.B. Zahlungserinnerung"
              />
            </div>
            <div>
              <Label>Kategorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_reminder">Zahlungserinnerung</SelectItem>
                  <SelectItem value="welcome">Willkommen</SelectItem>
                  <SelectItem value="contract_renewal">Vertragsverlängerung</SelectItem>
                  <SelectItem value="maintenance">Wartung</SelectItem>
                  <SelectItem value="general">Allgemein</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Betreff</Label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="E-Mail-Betreff"
            />
          </div>
          <div>
            <Label>Nachricht</Label>
            <Textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="E-Mail-Inhalt..."
              className="min-h-48"
            />
            <p className="text-xs text-slate-500 mt-2">
              Verfügbare Variablen: {{'{'}}{'{'}tenant_name{'}'}}{'}''}, {{'{'}}{'{'}amount{'}'}}{'}''}, {{'{'}}{'{'}date{'}'}}{'}''}, {{'{'}}{'{'}property_address{'}'}}{'}'}}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Speichern</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}