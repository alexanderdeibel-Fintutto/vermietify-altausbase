import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Building, TrendingDown, Calculator, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import PurchaseContractDialog from './PurchaseContractDialog';
import FinancingDialog from './FinancingDialog';

export default function BuildingFinanceTab({ buildingId, building }) {
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [financingDialogOpen, setFinancingDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();

  const { data: purchaseContract } = useQuery({
    queryKey: ['purchaseContract', buildingId],
    queryFn: async () => {
      const contracts = await base44.entities.PurchaseContract.filter({ building_id: buildingId });
      return contracts[0] || null;
    }
  });

  const { data: financings = [] } = useQuery({
    queryKey: ['financings', buildingId],
    queryFn: () => base44.entities.Financing.filter({ building_id: buildingId })
  });

  const { data: afaSchedule } = useQuery({
    queryKey: ['afaSchedule', buildingId],
    queryFn: async () => {
      const schedules = await base44.entities.AfaSchedule.filter({ 
        building_id: buildingId,
        status: 'Aktiv'
      });
      return schedules[0] || null;
    }
  });

  const deleteFinancingMutation = useMutation({
    mutationFn: (id) => base44.entities.Financing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['financings', buildingId]);
      toast.success('Finanzierung gelöscht');
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Kaufvertrag */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-slate-600" />
              <div>
                <CardTitle>Kaufvertrag</CardTitle>
                <CardDescription>Kaufdaten und AfA-Grundlage</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingItem(purchaseContract);
                setPurchaseDialogOpen(true);
              }}
              size="sm"
            >
              {purchaseContract ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {purchaseContract ? 'Bearbeiten' : 'Erfassen'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!purchaseContract ? (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                Ohne Kaufvertrag kann keine AfA berechnet werden!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Kaufdatum</p>
                <p className="font-medium">{format(new Date(purchaseContract.kaufdatum), 'dd.MM.yyyy', { locale: de })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Eigentumsübergang</p>
                <p className="font-medium">{format(new Date(purchaseContract.eigentumsuebergang), 'dd.MM.yyyy', { locale: de })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kaufpreis gesamt</p>
                <p className="font-medium text-lg">{formatCurrency(purchaseContract.kaufpreis_gesamt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Grundstückswert</p>
                <p className="font-medium">{formatCurrency(purchaseContract.grundstueckswert)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gebäudewert</p>
                <p className="font-medium">{formatCurrency(purchaseContract.gebaeudewert)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Grunderwerbsteuer</p>
                <p className="font-medium">{formatCurrency(purchaseContract.grunderwerbsteuer)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">AfA-Bemessungsgrundlage</p>
                <p className="font-medium text-emerald-600">{formatCurrency(purchaseContract.afa_bemessungsgrundlage)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">AfA-Satz</p>
                <p className="font-medium">{purchaseContract.afa_satz}% p.a.</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">AfA pro Jahr</p>
                <p className="font-medium text-lg text-emerald-600">{formatCurrency(purchaseContract.afa_jahresbetrag)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AfA-Schedule */}
      {afaSchedule && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <div>
                <CardTitle className="text-emerald-900">AfA-Plan aktiv</CardTitle>
                <CardDescription className="text-emerald-700">{afaSchedule.bezeichnung}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-emerald-700">AfA pro Jahr</p>
                <p className="font-semibold text-emerald-900">{formatCurrency(afaSchedule.afa_jahresbetrag)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700">Bereits abgeschrieben</p>
                <p className="font-medium text-emerald-900">{formatCurrency(afaSchedule.bereits_abgeschrieben || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700">Restwert</p>
                <p className="font-medium text-emerald-900">{formatCurrency(afaSchedule.restwert || afaSchedule.bemessungsgrundlage)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-700">Ende geplant</p>
                <p className="font-medium text-emerald-900">
                  {afaSchedule.afa_ende_geplant ? format(new Date(afaSchedule.afa_ende_geplant), 'yyyy', { locale: de }) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finanzierungen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-slate-600" />
              <div>
                <CardTitle>Finanzierungen</CardTitle>
                <CardDescription>{financings.length} aktive Darlehen</CardDescription>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingItem(null);
                setFinancingDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {financings.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Finanzierungen erfasst</p>
          ) : (
            <div className="space-y-4">
              {financings.map(fin => (
                <div key={fin.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-slate-900">{fin.kreditgeber}</h4>
                      <p className="text-sm text-slate-600">{fin.darlehensart}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={fin.status === 'Aktiv' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                        {fin.status}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingItem(fin);
                          setFinancingDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Finanzierung wirklich löschen?')) {
                            deleteFinancingMutation.mutate(fin.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Darlehensbetrag</p>
                      <p className="font-medium">{formatCurrency(fin.darlehensbetrag)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Restschuld</p>
                      <p className="font-medium">{formatCurrency(fin.restschuld_aktuell || fin.darlehensbetrag)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Zinssatz</p>
                      <p className="font-medium">{fin.zinssatz_nominal}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Rate/Monat</p>
                      <p className="font-medium">{formatCurrency(fin.rate_monatlich)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Zinsbindung bis</p>
                      <p className="font-medium">{format(new Date(fin.zinsbindung_bis), 'dd.MM.yyyy', { locale: de })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PurchaseContractDialog
        open={purchaseDialogOpen}
        onClose={() => {
          setPurchaseDialogOpen(false);
          setEditingItem(null);
        }}
        buildingId={buildingId}
        building={building}
        contract={editingItem}
      />

      <FinancingDialog
        open={financingDialogOpen}
        onClose={() => {
          setFinancingDialogOpen(false);
          setEditingItem(null);
        }}
        buildingId={buildingId}
        financing={editingItem}
      />
    </div>
  );
}