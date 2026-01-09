import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, X, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DocumentUploadDialog({ open, onOpenChange, buildings = [], tenants = [], contracts = [], equipment = [], onSuccess }) {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Sonstiges',
    entity_type: '',
    entity_id: ''
  });
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFormData({ ...formData, name: selectedFile.name });
    }
  };

  const getEntitiesByType = () => {
    const type = formData.entity_type;
    if (type === 'building') return buildings;
    if (type === 'tenant') return tenants;
    if (type === 'contract') return contracts;
    if (type === 'equipment') return equipment;
    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!file) newErrors.file = 'Datei erforderlich';
    if (!formData.name.trim()) newErrors.name = 'Name erforderlich';
    if (formData.entity_type && !formData.entity_id) newErrors.entity_id = 'Entität erforderlich';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setUploading(true);
    try {
      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;

      // Determine file type
      const extension = file.name.split('.').pop().toLowerCase();
      let fileType = 'other';
      if (['pdf'].includes(extension)) fileType = 'pdf';
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) fileType = 'image';
      else if (['doc', 'docx', 'txt'].includes(extension)) fileType = 'document';
      else if (['xls', 'xlsx', 'csv'].includes(extension)) fileType = 'spreadsheet';

      // Get selected entity
      const selectedEntity = getEntitiesByType().find(e => e.id === formData.entity_id);

      // Build entity references
      const entityReferences = [];
      if (formData.entity_type && selectedEntity) {
        const typeMap = {
          building: 'building',
          tenant: 'tenant',
          contract: 'contract',
          equipment: 'equipment'
        };

        entityReferences.push({
          entity_type: typeMap[formData.entity_type],
          entity_id: selectedEntity.id,
          entity_name: selectedEntity.name
        });
      }

      // Create document
      const docData = {
        name: formData.name,
        category: formData.category,
        file_url: fileUrl,
        file_type: fileType,
        file_size: file.size,
        is_uploaded: true,
        status: 'erstellt',
        entity_references: entityReferences,
        [formData.entity_type + '_id']: formData.entity_id
      };

      const newDoc = await base44.entities.Document.create(docData);

      // Automatically analyze with AI
      if (newDoc?.id) {
        setAnalyzing(true);
        try {
          await base44.functions.invoke('analyzeDocument', {
            document_id: newDoc.id,
            file_url: fileUrl,
            content: formData.name
          });
          toast.success('Dokument hochgeladen und analysiert');
        } catch (error) {
          toast.success('Dokument hochgeladen (KI-Analyse fehlgeschlagen)');
        }
        setAnalyzing(false);
      }

      // Reset
      setFile(null);
      setFormData({
        name: '',
        category: 'Sonstiges',
        entity_type: '',
        entity_id: ''
      });
      setErrors({});
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Upload failed:', err);
      setErrors({ submit: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-light">Dokument hochladen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="text-sm font-light text-slate-700">Datei *</label>
            <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.txt,.xls,.xlsx,.csv"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-light text-slate-700">
                  {file ? file.name : 'Datei auswählen oder hierher ziehen'}
                </p>
                {file && <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
              </label>
            </div>
            {errors.file && <p className="text-red-500 text-xs mt-1 font-light">{errors.file}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-light text-slate-700">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Mietvertrag_2024"
              className="mt-1 font-light"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 font-light">{errors.name}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-light text-slate-700">Kategorie</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mietrecht">Mietrecht</SelectItem>
                <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                <SelectItem value="Finanzen">Finanzen</SelectItem>
                <SelectItem value="Sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entity Selection */}
          <div className="space-y-2">
            <div>
              <label className="text-sm font-light text-slate-700">Mit Entität verknüpfen</label>
              <Select value={formData.entity_type} onValueChange={(value) => setFormData({ ...formData, entity_type: value, entity_id: '' })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Keine Verknüpfung</SelectItem>
                  {buildings.length > 0 && <SelectItem value="building">🏢 Gebäude</SelectItem>}
                  {tenants.length > 0 && <SelectItem value="tenant">👤 Mieter</SelectItem>}
                  {contracts.length > 0 && <SelectItem value="contract">📄 Mietvertrag</SelectItem>}
                  {equipment.length > 0 && <SelectItem value="equipment">⚙️ Gerät</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {formData.entity_type && (
              <div>
                <label className="text-sm font-light text-slate-700">
                  {formData.entity_type === 'building' && 'Gebäude'}
                  {formData.entity_type === 'tenant' && 'Mieter'}
                  {formData.entity_type === 'contract' && 'Mietvertrag'}
                  {formData.entity_type === 'equipment' && 'Gerät'}
                </label>
                <Select value={formData.entity_id} onValueChange={(value) => setFormData({ ...formData, entity_id: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {getEntitiesByType().map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.entity_id && <p className="text-red-500 text-xs mt-1 font-light">{errors.entity_id}</p>}
              </div>
            )}
          </div>

          {errors.submit && <p className="text-red-500 text-sm font-light">{errors.submit}</p>}

          <div className="flex gap-2 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 font-light"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={uploading || analyzing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-light"
            >
              {uploading ? 'Wird hochgeladen...' : analyzing ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  KI analysiert...
                </>
              ) : 'Hochladen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}