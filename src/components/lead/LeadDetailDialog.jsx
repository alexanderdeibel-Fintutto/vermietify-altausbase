import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfModal } from '@/components/shared/VfModal';
import { VfDataField } from '@/components/data-display/VfDataField';
import { VfDataGrid } from '@/components/data-display/VfDataGrid';
import { VfBadge } from '@/components/shared/VfBadge';
import { VfProgress } from '@/components/shared/VfProgress';
import { Button } from '@/components/ui/button';
import { Mail, Phone, UserPlus, TrendingUp } from 'lucide-react';

export default function LeadDetailDialog({ leadId, open, onClose }) {
  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => base44.entities.Lead.get(leadId),
    enabled: !!leadId
  });

  const { data: calculations = [] } = useQuery({
    queryKey: ['lead-calculations', leadId],
    queryFn: () => base44.entities.CalculationHistory.filter({ lead_id: leadId }),
    enabled: !!leadId
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ['lead-quiz', leadId],
    queryFn: () => base44.entities.QuizResult.filter({ lead_id: leadId }),
    enabled: !!leadId
  });

  if (!lead) return null;

  return (
    <VfModal
      open={open}
      onOpenChange={onClose}
      title={lead.name || lead.email}
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <VfBadge variant={
            lead.interest_level === 'hot' ? 'error' :
            lead.interest_level === 'warm' ? 'warning' : 'default'
          }>
            {lead.interest_level}
          </VfBadge>
          <VfBadge variant={lead.status === 'converted' ? 'success' : 'default'}>
            {lead.status}
          </VfBadge>
        </div>

        <div>
          <div className="text-sm text-[var(--theme-text-muted)] mb-2">Lead Score</div>
          <VfProgress value={lead.score} max={100} variant="gradient" showValue />
        </div>

        <VfDataGrid columns={2}>
          <VfDataField label="E-Mail" value={lead.email} copyable />
          <VfDataField label="Telefon" value={lead.phone || '-'} copyable />
          <VfDataField label="Quelle" value={lead.source} />
          <VfDataField label="Anzahl Objekte" value={lead.property_count || '-'} />
          <VfDataField label="Nutzertyp" value={lead.user_type || '-'} />
          <VfDataField 
            label="Letzte Aktivität" 
            value={new Date(lead.last_activity_at).toLocaleString('de-DE')} 
          />
        </VfDataGrid>

        <div>
          <h4 className="font-semibold mb-3">Aktivitäten</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Berechnungen</span>
              <span className="font-semibold">{calculations.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quiz absolviert</span>
              <span className="font-semibold">{quizResults.length}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => window.open(`mailto:${lead.email}`)}>
            <Mail className="h-4 w-4 mr-2" />
            E-Mail senden
          </Button>
          {lead.phone && (
            <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${lead.phone}`)}>
              <Phone className="h-4 w-4 mr-2" />
              Anrufen
            </Button>
          )}
          {lead.status !== 'converted' && (
            <Button variant="gradient" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Konvertieren
            </Button>
          )}
        </div>
      </div>
    </VfModal>
  );
}