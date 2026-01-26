import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, Send, User, Home } from 'lucide-react';
import { formatCurrency } from '../../utils/costHelpers';
import { formatGermanDate } from '../../utils/dateHelpers';

export default function StatementDetailSheet({ statementId, onClose, onDownload, onSend }) {
  const { data: statement } = useQuery({
    queryKey: ['statement', statementId],
    queryFn: () => base44.entities.OperatingCostStatement.get(statementId),
    enabled: !!statementId
  });

  const { data: building } = useQuery({
    queryKey: ['building', statement?.building_id],
    queryFn: () => base44.entities.Building.get(statement.building_id),
    enabled: !!statement?.building_id
  });

  const { data: unitResults = [] } = useQuery({
    queryKey: ['unitResults', statementId],
    queryFn: () => base44.entities.OperatingCostUnitResult.filter({ statement_id: statementId }),
    enabled: !!statementId
  });

  if (!statement) return null;

  const tenantResults = unitResults.filter(r => r.tenant_id);
  const vacancyResults = unitResults.filter(r => !r.tenant_id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-end">
      <div className="bg-white w-full md:w-[500px] h-[90vh] md:h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Abrechnung {statement.abrechnungsjahr}</h2>
            <p className="text-sm text-gray-600">{building?.name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Gesamtkosten</p>
              <p className="font-semibold">{formatCurrency(statement.gesamtkosten)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Vorauszahlungen</p>
              <p className="font-semibold">{formatCurrency(statement.gesamtvorauszahlungen)}</p>
            </div>
          </div>

          {/* Tenant Results */}
          <div>
            <h3 className="font-semibold mb-3">Mieter-Abrechnungen ({tenantResults.length})</h3>
            <div className="space-y-2">
              {tenantResults.map(result => (
                <div key={result.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Mieter #{result.tenant_id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Kosten:</span>
                    <span>{formatCurrency(result.kosten_anteil_gesamt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vorauszahlung:</span>
                    <span>{formatCurrency(result.vorauszahlungen_gesamt)}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-semibold mt-1 pt-1 border-t ${
                    result.ergebnis >= 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    <span>{result.ergebnis >= 0 ? 'Nachzahlung:' : 'Guthaben:'}</span>
                    <span>{formatCurrency(Math.abs(result.ergebnis))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vacancy Results */}
          {vacancyResults.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Leerstände ({vacancyResults.length})</h3>
              <div className="space-y-2">
                {vacancyResults.map(result => (
                  <div key={result.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Einheit {result.unit_id.slice(0, 8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Kosten:</span>
                      <span>{formatCurrency(result.kosten_anteil_gesamt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => onDownload?.(statementId)} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              PDF herunterladen
            </Button>
            {statement.status !== 'Versendet' && (
              <Button onClick={() => onSend?.(statementId)} className="w-full bg-blue-900">
                <Send className="w-4 h-4 mr-2" />
                An Mieter versenden
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}