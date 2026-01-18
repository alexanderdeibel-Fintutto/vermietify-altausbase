import React from 'react';
import { VfModal } from '@/components/shared/VfModal';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import { VfBadge } from '@/components/shared/VfBadge';
import { Mail, Phone, Building, UserPlus } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function LeadDetailDialog({ lead, open, onClose, onConvert }) {
  if (!lead) return null;

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title={lead.name || lead.email}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Schließen</Button>
          {lead.status !== 'converted' && (
            <Button variant="gradient" onClick={() => onConvert(lead.id)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Zu Nutzer konvertieren
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-[var(--theme-text-muted)] mb-1">Status</div>
            <StatusBadge status={lead.status} />
          </div>
          <div>
            <div className="text-sm text-[var(--theme-text-muted)] mb-1">Lead-Score</div>
            <VfBadge variant={lead.score >= 70 ? 'success' : lead.score >= 40 ? 'warning' : 'error'}>
              {lead.score}/100
            </VfBadge>
          </div>
        </div>

        <div className="space-y-3">
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[var(--theme-text-muted)]" />
              <span>{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-[var(--theme-text-muted)]" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.property_count > 0 && (
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-[var(--theme-text-muted)]" />
              <span>{lead.property_count} Objekte</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-[var(--theme-surface)] rounded-lg">
          <div className="text-sm text-[var(--theme-text-muted)] mb-1">Quelle</div>
          <VfBadge>{lead.source}</VfBadge>
          {lead.utm_campaign && (
            <div className="text-xs text-[var(--theme-text-muted)] mt-2">
              Campaign: {lead.utm_campaign}
            </div>
          )}
        </div>

        <div className="text-sm text-[var(--theme-text-muted)]">
          Erstellt <TimeAgo date={lead.created_date} />
        </div>
      </div>
    </VfModal>
  );
}