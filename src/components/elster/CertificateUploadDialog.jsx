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
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [certificateType, setCertificateType] = useState('TEST');
  const [taxNumber, setTaxNumber] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !password || !taxNumber) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('certificate_file', file);
      formData.append('password', password);
      formData.append('certificate_type', certificateType);
      formData.append('tax_number', taxNumber);
      formData.append('certificate_name', certificateName || `${certificateType} Zertifikat`);

      const response = await base44.functions.invoke('uploadElsterCertificate', formData);

      if (response.data.success) {
        toast.success(response.data.message);
        onSuccess?.();
        onOpenChange(false);
        
        // Reset
        setFile(null);
        setPassword('');
        setTaxNumber('');
        setCertificateName('');
      }
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ELSTER-Zertifikat hochladen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Zertifikat-Name</Label>
            <Input
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="z.B. Produktiv-Zertifikat 2025"
            />
          </div>

          <div>
            <Label>Zertifikat-Typ</Label>
            <Select value={certificateType} onValueChange={setCertificateType}>
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
            <Label>Steuernummer</Label>
            <Input
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="z.B. 1096081508187"
            />
          </div>

          <div>
            <Label>Zertifikat-Datei (.pfx)</Label>
            <Input
              type="file"
              accept=".pfx,.p12"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>

          <div>
            <Label>Zertifikat-Passwort</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !password || !taxNumber}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}