import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Mail, Copy, Trash2, Clock } from 'lucide-react';

export default function PendingInvitationsTable({ invitations = [], onRefresh }) {
  const [deleting, setDeleting] = useState(null);

  const handleCopyLink = (token) => {
    const link = `${window.location.origin}/tester-accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopiert! 📋');
  };

  const handleResend = async (invitation) => {
    try {
      // Zähler erhöhen und E-Mail erneut versenden
      await base44.functions.invoke('sendTesterInvitation', {
        tester_name: invitation.name,
        invited_email: invitation.email,
        custom_message: ''
      });
      toast.success('Einladung erneut versendet ✅');
      onRefresh?.();
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await base44.entities.TesterInvitation.update(id, { status: 'revoked' });
      toast.success('Einladung widerrufen ✅');
      onRefresh?.();
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  if (!invitations || invitations.length === 0) {
    return (
      <Card className="p-12 text-center border border-slate-200">
        <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-light">Keine ausstehenden Einladungen</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {invitations.map(invitation => {
        const expiresAt = new Date(invitation.expires_at);
        const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysLeft <= 3;

        return (
          <Card key={invitation.id} className="p-4 border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Name & Email */}
              <div>
                <p className="text-sm font-light text-slate-700">{invitation.name}</p>
                <p className="text-xs font-light text-slate-400">{invitation.email}</p>
              </div>

              {/* Einladungsdatum */}
              <div className="text-xs font-light text-slate-600">
                <p className="font-medium text-slate-700">Eingeladen am</p>
                <p>{format(new Date(invitation.invited_at), 'dd.MM.yyyy', { locale: de })}</p>
              </div>

              {/* Ablaufdatum */}
              <div className="text-xs font-light text-slate-600">
                <p className="font-medium text-slate-700">Gültig bis</p>
                <div className="flex items-center gap-1">
                  {isExpiringSoon ? (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      {daysLeft} Tage
                    </Badge>
                  ) : (
                    <p>{daysLeft} Tage</p>
                  )}
                </div>
              </div>

              {/* Wiederversendt */}
              <div className="text-xs font-light text-slate-600">
                <p className="font-medium text-slate-700">Versendet</p>
                <p>{invitation.resend_count} Mal</p>
              </div>

              {/* Aktionen */}
              <div className="flex gap-2 items-start pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyLink(invitation.id)}
                  className="text-xs h-8"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResend(invitation)}
                  className="text-xs h-8"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Neu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(invitation.id)}
                  disabled={deleting === invitation.id}
                  className="text-red-600 hover:text-red-700 h-8"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}