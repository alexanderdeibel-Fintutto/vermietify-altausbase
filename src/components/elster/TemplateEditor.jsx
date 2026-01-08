import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    form_type: 'ANLAGE_V',
    legal_form: 'PRIVATPERSON',
    year: new Date().getFullYear(),
    version: '1.0',
    description: ''
  });

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['elster-templates'],
    queryFn: () => base44.entities.ElsterFormTemplate.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (selectedTemplate) {
        return base44.entities.ElsterFormTemplate.update(selectedTemplate.id, data);
      }
      return base44.entities.ElsterFormTemplate.create(data);
    },
    onSuccess: () => {
      toast.success('Template gespeichert');
      queryClient.invalidateQueries({ queryKey: ['elster-templates'] });
      setSelectedTemplate(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ElsterFormTemplate.delete(id),
    onSuccess: () => {
      toast.success('Template gelöscht');
      queryClient.invalidateQueries({ queryKey: ['elster-templates'] });
      setSelectedTemplate(null);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Templates
            <Button size="sm" onClick={() => setSelectedTemplate(null)}>
              <Plus className="w-4 h-4 mr-1" />
              Neu
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {templates.map(template => (
              <div
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setFormData({
                    form_type: template.form_type,
                    legal_form: template.legal_form,
                    year: template.year,
                    version: template.version,
                    description: template.description
                  });
                }}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-slate-50 ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="font-medium text-sm">{template.form_type}</div>
                <div className="text-xs text-slate-600">
                  {template.legal_form} · {template.year}
                </div>
                {template.is_active && (
                  <Badge variant="outline" className="mt-1 text-xs">Aktiv</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            {selectedTemplate ? 'Template bearbeiten' : 'Neues Template'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Formular-Typ</Label>
              <Select
                value={formData.form_type}
                onValueChange={(value) => setFormData({ ...formData, form_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANLAGE_V">Anlage V</SelectItem>
                  <SelectItem value="EUER">EÜR</SelectItem>
                  <SelectItem value="EST1B">ESt 1B</SelectItem>
                  <SelectItem value="GEWERBESTEUER">Gewerbesteuer</SelectItem>
                  <SelectItem value="UMSATZSTEUER">Umsatzsteuer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rechtsform</Label>
              <Select
                value={formData.legal_form}
                onValueChange={(value) => setFormData({ ...formData, legal_form: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATPERSON">Privatperson</SelectItem>
                  <SelectItem value="GBR">GbR</SelectItem>
                  <SelectItem value="GMBH">GmbH</SelectItem>
                  <SelectItem value="UG">UG</SelectItem>
                  <SelectItem value="AG">AG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Jahr</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Version</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Template-Beschreibung..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
            {selectedTemplate && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(selectedTemplate.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}