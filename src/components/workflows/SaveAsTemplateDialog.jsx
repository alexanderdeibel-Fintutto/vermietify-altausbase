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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function SaveAsTemplateDialog({ workflow, companyId, isOpen, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    template_name: workflow?.name || '',
    description: workflow?.description || '',
    category: 'general',
    tags: '',
    difficulty: 'intermediate'
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('saveWorkflowTemplate', {
        company_id: companyId,
        name: formData.template_name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        workflow_id: workflow?.id,
        difficulty: formData.difficulty
      }),
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Als Template speichern</DialogTitle>
          <DialogDescription>
            Speichern Sie diesen Workflow als wiederverwendbare Vorlage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Template-Name</label>
            <Input
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Beschreibung</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Was macht dieses Template?"
              className="mt-1 h-20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Kategorie</label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approval">Genehmigung</SelectItem>
                <SelectItem value="automation">Automatisierung</SelectItem>
                <SelectItem value="notification">Benachrichtigung</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Tags (kommagetrennt)
            </label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="z.B. schnell, dokumentation, genehmigung"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Schwierigkeitsstufe</label>
            <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Anfänger</SelectItem>
                <SelectItem value="intermediate">Fortgeschritten</SelectItem>
                <SelectItem value="advanced">Experte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.template_name || saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending ? 'Speichert...' : 'Als Template speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}