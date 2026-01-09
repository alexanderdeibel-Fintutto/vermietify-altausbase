import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Mail, Copy, Trash2, Clock } from 'lucide-react';

// Memoized invitation row
const InvitationRow = React.memo(({ invitation, onResend, onCopy, onDelete, isDeleting }) => {
  const expiresAt = new Date(invitation.expires_at);
  const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 3;

  return (
    <Card className="p-4 border border-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Name & Email */}
        <div>
          <p className="text-sm font-light text-slate-700">{invitation.tester_name}</p>
          <p className="text-xs font-light text-slate-400">{invitation.invited_email}</p>
        </div>
        {/* Einladungsdatum */}
        <div className="text-xs font-light text-slate-600">
          <p className="font-medium text-slate-700">Eingeladen am</p>
          <p>{format(new Date(invitation.created_date), 'dd.MM.yyyy', { locale: de })}</p>
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
          <p>{invitation.resend_count || 0} Mal</p>
        </div>
        {/* Aktionen */}
        <div className="flex gap-2 items-start pt-2">
          <Button size="sm" variant="outline" onClick={() => onCopy(invitation.invitation_token)} className="text-xs h-8">
            <Copy className="w-3 h-3 mr-1" />
            Link
          </Button>
          <Button size="sm" variant="outline" onClick={() => onResend(invitation)} className="text-xs h-8">
            <Mail className="w-3 h-3 mr-1" />
            Neu
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(invitation.id)} disabled={isDeleting === invitation.id} className="text-red-600 hover:text-red-700 h-8">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

InvitationRow.displayName = 'InvitationRow';

export default function PendingInvitationsTable({ invitations = [], onRefresh }) {
  const [deleting, setDeleting] = useState(null);

  const handleCopyLink = (token) => {
    const link = `${window.location.origin}/tester-accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopiert! 📋');
  };

  const handleResend = async (invitation) => {
    try {
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

  // Virtualized rendering for large lists
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 80;
  const containerHeight = Math.min(600, invitations.length * itemHeight);
  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight));
    const endIdx = Math.min(invitations.length, startIdx + visibleCount + 2);
    return { startIdx, endIdx, offsetY: startIdx * itemHeight };
  }, [scrollTop, invitations.length, containerHeight]);

  if (!invitations || invitations.length === 0) {
    return (
      <Card className="p-12 text-center border border-slate-200">
        <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-light">Keine ausstehenden Einladungen</p>
      </Card>
    );
  }

  // Use virtualization for large lists
  if (invitations.length > 50) {
    return (
      <div
        className="overflow-y-auto border border-slate-200 rounded-lg"
        style={{ height: containerHeight }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
      >
        <div style={{ height: invitations.length * itemHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${visibleRange.offsetY}px)` }}>
            {invitations.slice(visibleRange.startIdx, visibleRange.endIdx).map(inv => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                onCopy={handleCopyLink}
                onResend={handleResend}
                onDelete={handleDelete}
                isDeleting={deleting}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invitations.map(invitation => (
        <InvitationRow
          key={invitation.id}
          invitation={invitation}
          onCopy={handleCopyLink}
          onResend={handleResend}
          onDelete={handleDelete}
          isDeleting={deleting}
        />
      ))}
    </div>
  );
}