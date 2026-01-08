import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Search, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import EmailTemplateEditor from '@/components/email/EmailTemplateEditor';

export default function EmailTemplates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => base44.entities.EmailTemplate.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template gelöscht');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: (template) => base44.entities.EmailTemplate.create({
      ...template,
      name: `${template.name} (Kopie)`,
      usage_count: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template dupliziert');
    }
  });

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'Alle', count: templates.length },
    { id: 'tenant', name: 'Mieter', count: templates.filter(t => t.category === 'tenant').length },
    { id: 'owner', name: 'Eigentümer', count: templates.filter(t => t.category === 'owner').length },
    { id: 'supplier', name: 'Dienstleister', count: templates.filter(t => t.category === 'supplier').length },
    { id: 'internal', name: 'Intern', count: templates.filter(t => t.category === 'internal').length },
    { id: 'system', name: 'System', count: templates.filter(t => t.category === 'system').length }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">E-Mail Templates</h1>
          <p className="text-slate-600">Verwalten Sie Ihre E-Mail-Vorlagen</p>
        </div>
        <Button 
          onClick={() => {
            setEditingTemplate(null);
            setEditorOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Template erstellen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categories.map(cat => (
          <Card 
            key={cat.id}
            className={`cursor-pointer transition-all ${
              selectedCategory === cat.id ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-slate-50'
            }`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-slate-600">{cat.name}</div>
                  <div className="text-2xl font-bold">{cat.count}</div>
                </div>
                <Mail className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Templates durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{template.subject}</p>
                </div>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  <span className="text-sm text-slate-500">
                    {template.usage_count}x verwendet
                  </span>
                </div>
                
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Variablen:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map(v => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {v}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTemplate(template);
                      setEditorOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateMutation.mutate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Template wirklich löschen?')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Keine Templates gefunden
            </h3>
            <p className="text-slate-600 mb-4">
              Erstellen Sie Ihr erstes E-Mail-Template
            </p>
          </CardContent>
        </Card>
      )}

      <EmailTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
      />
    </div>
  );
}