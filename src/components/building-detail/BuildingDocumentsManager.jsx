import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Upload, Download, Trash2, File, Image } from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_CATEGORIES = [
  { value: 'blueprint', label: 'Bauplan', icon: '📐' },
  { value: 'maintenance_history', label: 'Wartungshistorie', icon: '🔧' },
  { value: 'inspection', label: 'Prüfprotokoll', icon: '✅' },
  { value: 'certificate', label: 'Zertifikat', icon: '📜' },
  { value: 'photo', label: 'Foto', icon: '📷' },
  { value: 'other', label: 'Sonstiges', icon: '📄' }
];

export default function BuildingDocumentsManager({ buildingId }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['building-documents', buildingId],
    queryFn: () => base44.entities.Document.filter({ 
      building_id: buildingId,
      is_uploaded: true 
    }, '-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['building-documents', buildingId] });
      toast.success('Dokument gelöscht');
    }
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.Document.create({
        name: file.name,
        category: category,
        status: 'erstellt',
        file_url: file_url,
        file_type: file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
        file_size: file.size,
        is_uploaded: true,
        building_id: buildingId,
        notes: description
      });

      queryClient.invalidateQueries({ queryKey: ['building-documents', buildingId] });
      toast.success('Dokument hochgeladen');
      setDescription('');
      e.target.value = '';
    } catch (error) {
      toast.error('Upload fehlgeschlagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType === 'image') return Image;
    if (fileType === 'pdf') return FileText;
    return File;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Gebäude-Dokumente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Beschreibung (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Stockwerk 2, Heizung"
              />
            </div>
          </div>
          
          <label>
            <Button 
              variant="outline" 
              className="w-full" 
              disabled={uploading}
              asChild
            >
              <div>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Lädt hoch...' : 'Datei hochladen'}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
            </Button>
          </label>
        </div>

        {/* Documents List */}
        <div className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Keine Dokumente vorhanden
            </p>
          ) : (
            documents.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              const categoryInfo = DOCUMENT_CATEGORIES.find(c => c.value === doc.category);
              
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {categoryInfo?.icon} {categoryInfo?.label}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        {new Date(doc.created_date).toLocaleDateString('de-DE')}
                      </span>
                      {doc.file_size && (
                        <>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            {(doc.file_size / 1024).toFixed(0)} KB
                          </span>
                        </>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-slate-600 mt-1">{doc.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}