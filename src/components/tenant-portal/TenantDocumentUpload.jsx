import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Trash2, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';

const documentCategories = [
  { value: 'contract_amendment', label: 'Vertragsänderung' },
  { value: 'damage_report', label: 'Schadenmeldung' },
  { value: 'rent_receipt', label: 'Mietbescheinigung' },
  { value: 'deposit_confirmation', label: 'Kautionsbestätigung' },
  { value: 'other', label: 'Sonstiges' }
];

export default function TenantDocumentUpload({ tenantId, contractId }) {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['tenant-documents', tenantId],
    queryFn: async () => {
      const docs = await base44.entities.Document.filter({ tenant_id: tenantId });
      return docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!tenantId
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.Document.create({
        name: file.name,
        category: category === 'other' ? 'Sonstiges' : category,
        status: 'erstellt',
        file_url,
        is_uploaded: true,
        file_type: file.type.includes('pdf') ? 'pdf' : 'image',
        file_size: file.size,
        tenant_id: tenantId,
        contract_id: contractId,
        notes: description
      });

      toast.success('Dokument hochgeladen');
      setDescription('');
      queryClient.invalidateQueries(['tenant-documents']);
    } catch (error) {
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-documents']);
      toast.success('Dokument gelöscht');
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Dokument hochladen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Kategorie</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Beschreibung (optional)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Dokuments"
            />
          </div>

          <div>
            <label htmlFor="file-upload" className="block">
              <Button
                disabled={uploading}
                variant="outline"
                className="w-full"
                asChild
              >
                <div>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Lädt hoch...' : 'Datei auswählen'}
                </div>
              </Button>
              <input
                id="file-upload"
                type="file"
                onChange={handleUpload}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meine Dokumente</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Noch keine Dokumente hochgeladen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>{new Date(doc.created_date).toLocaleDateString('de-DE')}</span>
                        {doc.category && (
                          <Badge variant="outline" className="text-xs">
                            {doc.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="icon" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}