import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentTemplateManager({ onUseTemplate }) {
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', category: '', content: '' });
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['document-templates'],
    queryFn: () => base44.entities.DocumentTemplate?.list?.() || []
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.DocumentTemplate.create({
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        content: JSON.stringify(newTemplate.content),
        is_public: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      setNewTemplate({ name: '', description: '', category: '', content: '' });
      setSaveOpen(false);
      toast.success('Template gespeichert');
    }
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      const template = templates.find(t => t.id === templateId);
      const newCount = (template.usage_count || 0) + 1;
      await base44.entities.DocumentTemplate.update(templateId, { usage_count: newCount });
      return template;
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      onUseTemplate(template);
      setOpen(false);
      toast.success('Template verwendet');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      return await base44.entities.DocumentTemplate.delete(templateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast.success('Template gelöscht');
    }
  });

  return (
    <>
      {/* Use Template Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Copy className="w-4 h-4" />
            Template verwenden
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dokumentvorlage wählen</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.length === 0 ? (
              <p className="text-sm text-slate-500 col-span-2 text-center py-4">
                Noch keine Templates verfügbar
              </p>
            ) : (
              templates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition">
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-1">{template.name}</h3>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                      {template.description}
                    </p>
                    {template.category && (
                      <Badge variant="outline" className="text-xs mb-2 inline-block">
                        {template.category}
                      </Badge>
                    )}
                    <div className="flex gap-2 justify-between">
                      <span className="text-xs text-slate-500">
                        {template.usage_count || 0}x verwendet
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 gap-1"
                          onClick={() => useTemplateMutation.mutate(template.id)}
                        >
                          <Copy className="w-3 h-3" />
                          Verwenden
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 text-red-600 hover:text-red-700"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Als Template speichern
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokument als Template speichern</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Template-Name</Label>
              <Input
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="z.B. Geschäftsbericht Vorlage"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Beschreibung</Label>
              <Textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Kurzbeschreibung des Templates"
                rows={2}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Kategorie</Label>
              <Input
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                placeholder="z.B. Berichte"
                className="text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSaveOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => saveTemplateMutation.mutate()}
                disabled={!newTemplate.name || saveTemplateMutation.isPending}
              >
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}