import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const DOCTYPE_LABELS = {
  invoice: 'Rechnung',
  lease_contract: 'Mietvertrag',
  handover_protocol: 'Übergabeprotokoll',
  property_tax: 'Grundsteuerbescheid',
  insurance: 'Versicherung',
  bank_statement: 'Kontoauszug',
  other: 'Sonstiges'
};

const DOCTYPE_COLORS = {
  invoice: 'bg-blue-100 text-blue-800',
  lease_contract: 'bg-green-100 text-green-800',
  handover_protocol: 'bg-orange-100 text-orange-800',
  property_tax: 'bg-purple-100 text-purple-800',
  insurance: 'bg-cyan-100 text-cyan-800',
  bank_statement: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800'
};

const STATUS_LABELS = {
  processing: { label: 'Wird analysiert', icon: Clock, color: 'text-blue-600' },
  pending: { label: 'Ausstehend', icon: AlertCircle, color: 'text-amber-600' },
  auto_matched: { label: 'Auto-Zugeordnet', icon: CheckCircle2, color: 'text-green-600' },
  approved: { label: 'Erledigt', icon: CheckCircle2, color: 'text-emerald-600' },
  rejected: { label: 'Abgelehnt', icon: AlertCircle, color: 'text-red-600' }
};

export default function InboxCard({ item, onEdit }) {
  const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
  const StatusIcon = statusInfo.icon;

  const getItemSummary = () => {
    switch (item.document_type) {
      case 'invoice':
        return `${item.supplier_name || 'Unbekannter Lieferant'} • ${item.total_amount?.toFixed(2) || '?'}€`;
      case 'lease_contract':
        return `${item.tenant_name || 'Mieter'} • ${item.unit_identifier || 'Einheit unbekannt'} • ${item.total_rent?.toFixed(0) || '?'}€`;
      case 'handover_protocol':
        return `${item.tenant_name || 'Mieter'} • ${item.handover_type === 'move_in' ? 'Einzug' : 'Auszug'} • ${item.handover_date || '?'}`;
      default:
        return item.original_filename || 'Dokument';
    }
  };

  const getMatchInfo = () => {
    if (item.was_auto_matched) {
      return `✅ Automatisch zugeordnet zu ${item.matched_entity_type} (${item.match_confidence}% Match)`;
    }
    if (item.match_confidence > 0) {
      return `⚠️ Match zu ${item.matched_entity_type} (${item.match_confidence}%) - Bitte bestätigen`;
    }
    return '⚠️ Kein eindeutiger Match - Bitte manuell zuordnen';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start gap-4">
          {/* Left */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{item.original_filename}</h3>
              <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
            </div>

            <div className="flex gap-2 mb-3 flex-wrap">
              <Badge className={DOCTYPE_COLORS[item.document_type]}>
                {DOCTYPE_LABELS[item.document_type] || item.document_type}
              </Badge>
              {item.is_system_template && (
                <Badge variant="outline">🏷️ System-Template</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {Math.round(item.ai_type_confidence || 0)}% erkannt
              </Badge>
            </div>

            <p className="text-sm text-slate-600 mb-2">{getItemSummary()}</p>

            {/* Confidence Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Extraktionsqualität</span>
                <span>{Math.round(item.ai_extraction_confidence || 0)}%</span>
              </div>
              <Progress value={item.ai_extraction_confidence || 0} className="h-2" />
            </div>

            <p className="text-xs text-slate-600 mb-2">{getMatchInfo()}</p>

            <p className="text-xs text-slate-400">
              {item.source_email_from && `Von: ${item.source_email_from} • `}
              {new Date(item.created_date).toLocaleDateString('de-DE')}
            </p>
          </div>

          {/* Right */}
          <div className="flex gap-2">
            {item.status === 'pending' && (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Bearbeiten
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  ✓ Bestätigen
                </Button>
              </>
            )}
            {item.status === 'auto_matched' && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Details
              </Button>
            )}
            {item.status === 'processing' && (
              <div className="text-sm text-slate-500 py-1">wird analysiert...</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}