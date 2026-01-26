import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, User, Home, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Step5Summary({ data, onBack, draftId, onSuccess }) {
  const [results, setResults] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isCalculating, setIsCalculating] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    calculateStatement();
  }, []);

  const calculateStatement = async () => {
    setIsCalculating(true);
    try {
      // Backend-Berechnung aufrufen
      const response = await base44.functions.invoke('calculateOperatingCostStatement', {
        buildingId: data.building_id,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        selectedUnits: data.selected_units,
        costItems: Object.entries(data.costs || {}).map(([id, costData]) => ({
          costTypeId: id,
          costType: costData.costType.sub_category,
          amount: costData.total,
          distributionKey: costData.distributionKey,
          description: costData.costType.bezeichnung || costData.costType.sub_category
        })),
        directCosts: data.directCosts || {}
      });

      if (response.data.success) {
        setResults(response.data.tenantResults);
        toast.success('Berechnung abgeschlossen');
      }
    } catch (error) {
      toast.error('Fehler bei der Berechnung: ' + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  // PDF Export
  const exportPDFMutation = useMutation({
    mutationFn: async (unitResultId) => {
      return await base44.functions.invoke('exportOperatingCostsPDF', {
        statement_id: draftId,
        unit_result_id: unitResultId
      });
    },
    onSuccess: (response) => {
      if (response.data.pdf_url) {
        window.open(response.data.pdf_url, '_blank');
        toast.success('PDF wird geöffnet');
      }
    },
    onError: (error) => {
      toast.error('PDF-Export fehlgeschlagen: ' + error.message);
    }
  });

  // Email-Versand
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('sendOperatingCostEmail', {
        statementId: draftId,
        sendToAll: true
      });
    },
    onSuccess: (response) => {
      if (response.data.success) {
        toast.success(`${response.data.sent} Emails versendet`);
        if (response.data.errors > 0) {
          toast.warning(`${response.data.errors} Fehler beim Versand`);
        }
        queryClient.invalidateQueries({ queryKey: ['operatingCostStatements'] });
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error('Versand fehlgeschlagen: ' + error.message);
    }
  });

  if (isCalculating) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin mb-4" />
        <p className="text-gray-600">Abrechnung wird berechnet...</p>
      </div>
    );
  }

  const summary = {
    totalCosts: results.reduce((sum, r) => sum + r.totalCost, 0),
    totalAdvances: results.reduce((sum, r) => sum + r.advancePayments, 0),
    totalRefunds: results.filter(r => r.difference < 0).reduce((sum, r) => sum + Math.abs(r.difference), 0),
    totalBalances: results.filter(r => r.difference > 0).reduce((sum, r) => sum + r.difference, 0)
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Zusammenfassung</h2>
        <p className="text-gray-600">Überprüfen Sie die berechnete Abrechnung</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Gesamtkosten</p>
            <p className="text-2xl font-bold">{summary.totalCosts.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Vorauszahlungen</p>
            <p className="text-2xl font-bold">{summary.totalAdvances.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Guthaben</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalRefunds.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Nachzahlungen</p>
            <p className="text-2xl font-bold text-orange-600">{summary.totalBalances.toFixed(2)} €</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Results */}
      <div className="space-y-3">
        {results.map((result, idx) => {
          const isExpanded = expandedItems.has(idx);
          const isRefund = result.difference < 0;

          return (
            <Card key={idx} className={isRefund ? 'border-green-500' : 'border-orange-500'}>
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleExpanded(idx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.tenant ? (
                      <User className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Home className="w-5 h-5 text-orange-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {result.tenant?.name || 'Leerstand'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {result.unit.unit_number} • {result.unit.wohnflaeche_qm} m²
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Kosten: {result.totalCost.toFixed(2)} €</p>
                      <p className="text-sm text-gray-600">Vorauszahlung: {result.advancePayments.toFixed(2)} €</p>
                      <Badge className={isRefund ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                        {isRefund ? 'Guthaben' : 'Nachzahlung'}: {Math.abs(result.difference).toFixed(2)} €
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-sm font-semibold mb-2">Kostenaufschlüsselung:</p>
                    {result.costDetails.map((detail, detailIdx) => (
                      <div key={detailIdx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {detail.category}
                          <Badge variant="outline" className="ml-2 text-xs">{detail.distributionKey}</Badge>
                        </span>
                        <span className="font-medium">{detail.amount.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Abrechnung abschließen</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportPDFMutation.mutate()}
              disabled={exportPDFMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF herunterladen
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={sendEmailMutation.isPending}
              className="bg-blue-900"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird versendet...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  An alle Mieter senden
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
        <Button onClick={onSuccess} variant="outline">
          Abschließen
        </Button>
      </div>
    </div>
  );
}