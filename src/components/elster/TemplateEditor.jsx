import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['elster-templates'],
    queryFn: () => base44.entities.ElsterFormTemplate.list()
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (selectedTemplate?.id) {
        return base44.entities.ElsterFormTemplate.update(selectedTemplate.id, data);
      }
      return base44.entities.ElsterFormTemplate.create(data);
    },
    onSuccess: () => {
      toast.success('Template gespeichert');
      queryClient.invalidateQueries({ queryKey: ['elster-templates'] });
      setEditing(false);
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
    if (!selectedTemplate?.form_type || !selectedTemplate?.legal_form || !selectedTemplate?.year) {
      toast.error('Pflichtfelder fehlen');
      return;
    }

    saveMutation.mutate(selectedTemplate);
  };

  const handleDuplicate = () => {
    const duplicate = {
      ...selectedTemplate,
      id: undefined,
      version: (parseFloat(selectedTemplate.version || '1.0') + 0.1).toFixed(1),
      description: `${selectedTemplate.description} (Kopie)`
    };
    setSelectedTemplate(duplicate);
    setEditing(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Templates</CardTitle>
            <Button size="sm" onClick={() => {
              setSelectedTemplate({
                form_type: '',
                legal_form: '',
                year: new Date().getFullYear(),
                xml_template: '',
                field_mappings: {},
                validation_rules: [],
                is_active: true,
                version: '1.0'
              });
              setEditing(true);
            }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templates.map(template => (
              <div
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setEditing(false);
                }}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="font-medium text-sm">{template.form_type}</div>
                <div className="text-xs text-slate-600">
                  {template.legal_form} • {template.year}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-xs">
                    v{template.version}
                  </Badge>
                  {!template.is_active && (
                    <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Editor */}
      <div className="lg:col-span-2">
        {selectedTemplate ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {editing ? 'Template bearbeiten' : 'Template Details'}
                </CardTitle>
                <div className="flex gap-2">
                  {!editing && selectedTemplate.id && (
                    <>
                      <Button size="sm" variant="outline" onClick={handleDuplicate}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(selectedTemplate.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Formular-Typ *</Label>
                  <Select
                    value={selectedTemplate.form_type}
                    onValueChange={(v) => setSelectedTemplate({...selectedTemplate, form_type: v})}
                    disabled={!editing}
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
                  <Label>Rechtsform *</Label>
                  <Select
                    value={selectedTemplate.legal_form}
                    onValueChange={(v) => setSelectedTemplate({...selectedTemplate, legal_form: v})}
                    disabled={!editing}
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

                <div>
                  <Label>Jahr *</Label>
                  <Input
                    type="number"
                    value={selectedTemplate.year}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, year: parseInt(e.target.value)})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Version</Label>
                  <Input
                    value={selectedTemplate.version}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, version: e.target.value})}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={selectedTemplate.description || ''}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, description: e.target.value})}
                  disabled={!editing}
                  rows={2}
                />
              </div>

              <div>
                <Label>XML Template</Label>
                <Textarea
                  value={selectedTemplate.xml_template}
                  onChange={(e) => setSelectedTemplate({...selectedTemplate, xml_template: e.target.value})}
                  disabled={!editing}
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>

              {editing && (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEditing(false);
                    if (!selectedTemplate.id) {
                      setSelectedTemplate(null);
                    }
                  }}>
                    Abbrechen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-slate-600">
              Wählen Sie ein Template aus oder erstellen Sie ein neues
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}