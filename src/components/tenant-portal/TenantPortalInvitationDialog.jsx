import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantPortalInvitationDialog({ tenant, onInvitationSent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleActivatePortal = async () => {
    setIsSending(true);
    try {
      await base44.functions.invoke('activateTenantPortal', {
        tenant_id: tenant.id,
        tenant_email: tenant.email
      });

      toast.success('Portalzugang aktiviert und Einladung versendet');
      setIsOpen(false);
      if (onInvitationSent) {
        onInvitationSent();
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const isAlreadyEnabled = tenant.portal_access_enabled;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={isAlreadyEnabled}
          className={isAlreadyEnabled ? 'opacity-50 cursor-not-allowed' : 'gap-2'}
        >
          <Mail className="w-4 h-4" />
          {isAlreadyEnabled ? 'Bereits aktiviert' : 'Portal aktivieren'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mieterportal aktivieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>{tenant.name}</strong> erhält Zugang zum Mieterportal und eine Einladungs-E-Mail an <strong>{tenant.email}</strong>.
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <p className="font-semibold">Der Mieter kann dann:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Mietvertragsinformationen anzeigen</li>
              <li>Zahlungshistorie einsehen</li>
              <li>Wartungsanfragen stellen</li>
              <li>Mit dem Team kommunizieren</li>
              <li>Dokumente herunterladen</li>
            </ul>
          </div>

          <Button
            onClick={handleActivatePortal}
            disabled={isSending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird aktiviert...
              </>
            ) : (
              'Portal aktivieren & E-Mail versenden'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}