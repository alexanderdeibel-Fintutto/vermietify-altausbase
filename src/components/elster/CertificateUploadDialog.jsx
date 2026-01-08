import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CertificateUploadDialog({ open, onOpenChange, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    certificate_name: '',
    certificate_file: null,
    certificate_password: '',
    certificate_type: 'TEST',
    tax_number: '',
    valid_from: '',
    valid_until: ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, certificate_file: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!formData.certificate_name || !formData.certificate_file || !formData.tax_number) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    setUploading(true);
    try {
      const response = await base44.functions.invoke('uploadElsterCertificate', formData);

      if (response.data.success) {
        toast.success('Zertifikat erfolgreich hochgeladen');
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Upload fehlgeschlagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>ELSTER-Zertifikat hochladen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Zertifikat-Name *</Label>
            <Input
              placeholder="z.B. Test-Zertifikat 2024"
              value={formData.certificate_name}
              onChange={(e) => setFormData({ ...formData, certificate_name: e.target.value })}
            />
          </div>

          <div>
            <Label>Zertifikat-Datei (.pfx) *</Label>
            <Input
              type="file"
              accept=".pfx,.p12"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <Label>Zertifikat-Passwort *</Label>
            <Input
              type="password"
              placeholder="Passwort"
              value={formData.certificate_password}
              onChange={(e) => setFormData({ ...formData, certificate_password: e.target.value })}
            />
          </div>

          <div>
            <Label>Typ *</Label>
            <Select
              value={formData.certificate_type}
              onValueChange={(value) => setFormData({ ...formData, certificate_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEST">Test-Zertifikat</SelectItem>
                <SelectItem value="PRODUCTION">Produktiv-Zertifikat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Steuernummer *</Label>
            <Input
              placeholder="z.B. 1096081508187"
              value={formData.tax_number}
              onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gültig von</Label>
              <Input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>
            <div>
              <Label>Gültig bis</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpload} disabled={uploading} className="flex-1">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird hochgeladen...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Hochladen & Testen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}