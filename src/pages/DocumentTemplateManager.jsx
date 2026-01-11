import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import TemplateEditor from '@/components/documents/TemplateEditor';
import TemplatePreview from '@/components/documents/TemplatePreview';
import TemplateVersionManager from '@/components/documents/TemplateVersionManager';
import BuildingTemplateAssigner from '@/components/documents/BuildingTemplateAssigner';

const DOCUMENT_TYPES = [
  'mietvertrag',
  'uebergabeprotokoll_einzug',
  'uebergabeprotokoll_auszug',
  'mietangebot',
  'sepa_mandat',
  'zahlungserinnerung',
  'mahnung',
  'abmahnung',
  'kuendigung',
  'betriebskostenabrechnung',
  'mieterhoehung',
  'wohnungsgeberbestaetigung',
  'schadensanzeige',
  'auftragserteilung',
  'kautionsquittung'
];

export default function DocumentTemplateManager() {
  const [selectedType, setSelectedType] = useState(DOCUMENT_TYPES[0]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showBuildingAssign, setShowBuildingAssign] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['documentTemplates'],
    queryFn: () => base44.entities.DocumentTemplate.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (template) => {
      if (template.id) {
        return await base44.entities.DocumentTemplate.update(template.id, template);
      } else {
        return await base44.entities.DocumentTemplate.create(template);
      }
    },
    onSuccess: () => {
      toast.success('Template gespeichert!');
      queryClient.invalidateQueries(['documentTemplates']);
      setShowEditor(false);
      setEditingTemplate(null);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.DocumentTemplate.delete(id);
    },
    onSuccess: () => {
      toast.success('Template gelöscht!');
      queryClient.invalidateQueries(['documentTemplates']);
    }
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const newTemplate = { ...template };
      delete newTemplate.id;
      newTemplate.document_type = `${newTemplate.document_type}_copy_${Date.now()}`;
      return await base44.entities.DocumentTemplate.create(newTemplate);
    },
    onSuccess: () => {
      toast.success('Template dupliziert!');
      queryClient.invalidateQueries(['documentTemplates']);
    }
  });

  const typeTemplates = templates.filter(t => t.document_type === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dokumenten-Templates</h1>
        <Button onClick={() => {
          setEditingTemplate({
            document_type: selectedType,
            template_html: '',
            template_fields: [],
            is_active: true
          });
          setShowEditor(true);
        }} className="gap-2">
          <Plus className="w-4 h-4" /> Neues Template
        </Button>
      </div>

      <div>
        <label className="text-sm font-medium">Dokumenttyp</label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showEditor && editingTemplate ? (
        <div className="space-y-4 border rounded-lg p-6 bg-slate-50">
          <h2 className="text-xl font-semibold">{editingTemplate.document_type} - Editor</h2>

          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Vorschau</TabsTrigger>
            </TabsList>

            <TabsContent value="editor">
              <TemplateEditor
                template={editingTemplate}
                onChange={setEditingTemplate}
              />
            </TabsContent>

            <TabsContent value="preview">
              <TemplatePreview
                template={editingTemplate}
                fields={editingTemplate.template_fields || []}
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => saveTemplateMutation.mutate(editingTemplate)} disabled={saveTemplateMutation.isPending}>
              {saveTemplateMutation.isPending ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {typeTemplates.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-600">
              Keine Templates für diesen Typ. Erstelle ein neues.
            </div>
          ) : (
            typeTemplates.map(template => (
              <div key={template.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{template.document_type}</p>
                  <p className="text-sm text-slate-600">{template.building_id ? 'Gebäude-spezifisch' : 'Standard'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingTemplate(template);
                    setShowEditor(true);
                  }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingTemplate(template);
                    setShowBuildingAssign(true);
                  }}>
                    Gebäude
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingTemplate(template);
                    setShowVersions(true);
                  }}>
                    Versionen
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicateTemplateMutation.mutate(template)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteTemplateMutation.mutate(template.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showVersions && editingTemplate && (
        <div className="space-y-4 border rounded-lg p-6 bg-slate-50">
          <TemplateVersionManager
            templateId={editingTemplate.id}
            onBack={() => setShowVersions(false)}
          />
        </div>
      )}

      {showBuildingAssign && editingTemplate && (
        <BuildingTemplateAssigner
          templateId={editingTemplate.id}
          isOpen={showBuildingAssign}
          onClose={() => setShowBuildingAssign(false)}
        />
      )}
    </div>
  );
}