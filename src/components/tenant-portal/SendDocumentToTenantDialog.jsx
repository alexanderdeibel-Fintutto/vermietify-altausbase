import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Share2, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SendDocumentToTenantDialog({ unitId, buildingId, tenantId, tenantEmail }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('other');
  const [file, setFile] = useState(null);
  const [requireAck, setRequireAck] = useState(false);
  const queryClient = useQueryClient();
  
  const shareMutation = useMutation({
    mutationFn: async () => {
      // Datei hochladen
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Portal-Dokument erstellen
      const doc = await base44.entities.TenantPortalDocument.create({
        unit_id: unitId,
        building_id: buildingId,
        tenant_id: tenantId,
        document_type: docType,
        title,
        file_url,
        file_size: file.size,
        document_date: new Date().toISOString().split('T')[0],
        is_visible: true,
        requires_acknowledgment: requireAck
      });
      
      // E-Mail-Benachrichtigung
      await base44.integrations.Core.SendEmail({
        to: tenantEmail,
        subject: `Neues Dokument: ${title}`,
        body: `
          <h2>Neues Dokument verfügbar</h2>
          <p>Ein neues Dokument wurde für Sie freigegeben:</p>
          <p><strong>${title}</strong></p>
          <p>Sie können es in Ihrer MieterApp einsehen.</p>
          <p><a href="https://mieterapp.fintutto.de">Zur MieterApp</a></p>
        `
      });
      
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal-documents'] });
      toast.success('Dokument geteilt und Mieter benachrichtigt!');
      setOpen(false);
      setTitle('');
      setFile(null);
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="w-4 h-4" />
          Dokument teilen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument mit Mieter teilen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Dokumenttyp</label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operating_costs">Nebenkostenabrechnung</SelectItem>
                <SelectItem value="lease">Mietvertrag</SelectItem>
                <SelectItem value="utility_bills">Versorgungsrechnung</SelectItem>
                <SelectItem value="notice">Mitteilung</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Titel</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Nebenkostenabrechnung 2024"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Datei</label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="require-ack"
              checked={requireAck}
              onCheckedChange={setRequireAck}
            />
            <label htmlFor="require-ack" className="text-sm cursor-pointer">
              Bestätigung vom Mieter erforderlich
            </label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => shareMutation.mutate()}
              disabled={!title || !file || shareMutation.isPending}
              className="flex-1"
            >
              {shareMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird geteilt...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Teilen & Benachrichtigen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}