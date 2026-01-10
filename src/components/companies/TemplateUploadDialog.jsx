import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';

const categories = [
  { value: 'contract', label: 'Vertrag' },
  { value: 'agreement', label: 'Vereinbarung' },
  { value: 'regulation', label: 'Regelwerk' },
  { value: 'statement', label: 'Erklärung' },
  { value: 'other', label: 'Sonstiges' }
];

export default function TemplateUploadDialog({ isOpen, onClose, legalForm }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'contract',
    placeholders: []
  });
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      return base44.entities.DocumentTemplate.create({
        name: data.name,
        description: data.description,
        legal_form: legalForm,
        category: data.category,
        template_url: uploadResult.file_url,
        placeholders: data.placeholders,
        is_custom: true,
        created_by: (await base44.auth.me()).email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      handleClose();
    }
  });

  const handleClose = () => {
    setFormData({ name: '', description: '', category: 'contract', placeholders: [] });
    setFile(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!formData.name || !file) {
      alert('Name und Datei erforderlich');
      return;
    }
    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokumentvorlage hochladen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Vorlagenname *</label>
            <Input
              placeholder="z.B. NDA, Partnerschaftsvertrag"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Beschreibung</label>
            <textarea
              placeholder="Beschreibung dieser Vorlage"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm h-20 resize-none mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Kategorie</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Datei hochladen *</label>
            <label className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 block mt-1">
              <input
                type="file"
                accept=".docx,.pdf"
                onChange={(e) => setFile(e.target.files?.[0])}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                {file ? file.name : 'DOCX oder PDF hochladen'}
              </p>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              💡 Tipp: Verwenden Sie Platzhalter in Ihrer Vorlage (z.B. {"{company_name}"}, {"{address}"}) die automatisch ausgefüllt werden.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Wird hochgeladen...' : 'Hochladen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}