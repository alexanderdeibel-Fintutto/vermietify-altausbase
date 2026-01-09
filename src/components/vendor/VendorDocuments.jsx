import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Upload, Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import MobilePhotoUpload from '@/components/mobile/MobilePhotoUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VendorDocuments({ vendorId }) {
  const [showUpload, setShowUpload] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', document_type: 'other', file_url: '' });
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['vendorDocuments', vendorId],
    queryFn: () => base44.entities.VendorDocument.filter({ vendor_id: vendorId }, '-created_date', 100),
    enabled: !!vendorId
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return await base44.entities.VendorDocument.create({
        vendor_id: vendorId,
        ...data,
        uploaded_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorDocuments'] });
      toast.success('Dokument hochgeladen');
      setShowUpload(false);
      setNewDoc({ title: '', document_type: 'other', file_url: '' });
    }
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowUpload(!showUpload)} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Dokument hochladen
      </Button>

      {showUpload && (
        <div className="p-4 border rounded space-y-3">
          <div>
            <Label>Titel</Label>
            <Input value={newDoc.title} onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })} />
          </div>
          <div>
            <Label>Typ</Label>
            <Select value={newDoc.document_type} onValueChange={(v) => setNewDoc({ ...newDoc, document_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Vertrag</SelectItem>
                <SelectItem value="invoice">Rechnung</SelectItem>
                <SelectItem value="insurance">Versicherung</SelectItem>
                <SelectItem value="certification">Zertifikat</SelectItem>
                <SelectItem value="license">Lizenz</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <MobilePhotoUpload onUploadComplete={(urls) => setNewDoc({ ...newDoc, file_url: urls[0] })} maxFiles={1} />
          <Button onClick={() => uploadMutation.mutate(newDoc)} disabled={!newDoc.title || !newDoc.file_url}>
            Speichern
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <div>
                <p className="font-semibold text-sm">{doc.title}</p>
                <p className="text-xs text-slate-600">{doc.document_type}</p>
              </div>
            </div>
            {doc.file_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}