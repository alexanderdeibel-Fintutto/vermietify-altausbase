import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const ASSET_TYPES = ['immobilie', 'grundstück', 'wertpapier', 'beteiligung', 'sonstige'];

export default function AnlageVG() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    asset_type: 'immobilie',
    sale_date: new Date().toISOString().split('T')[0],
    acquisition_date: '',
    sale_price: 0,
    acquisition_costs: 0,
    improvement_costs: 0,
    selling_costs: 0,
    is_tax_exempt: false,
    exemption_reason: 'none'
  });

  const queryClient = useQueryClient();

  const { data: capitalGains = [] } = useQuery({
    queryKey: ['capitalGains', taxYear],
    queryFn: () => base44.entities.CapitalGain.filter({ tax_year: taxYear }) || []
  });

  const { data: calculation } = useQuery({
    queryKey: ['calculationVG', taxYear],
    queryFn: async () => {
      const res = await base44.functions.invoke('calculateTaxVG', {
        userId: (await base44.auth.me()).id,
        taxYear
      });
      return res.result;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const saleDate = new Date(data.sale_date);
      const acqDate = new Date(data.acquisition_date);
      const yearsHeld = (saleDate - acqDate) / (365.25 * 24 * 60 * 60 * 1000);
      
      const gainLoss = data.sale_price - data.acquisition_costs - (data.improvement_costs || 0) - (data.selling_costs || 0);
      
      return base44.entities.CapitalGain.create({
        ...data,
        tax_year: taxYear,
        sale_price: Number(data.sale_price),
        acquisition_costs: Number(data.acquisition_costs),
        improvement_costs: Number(data.improvement_costs) || 0,
        selling_costs: Number(data.selling_costs) || 0,
        gain_loss: gainLoss,
        speculation_period: yearsHeld
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGains'] });
      queryClient.invalidateQueries({ queryKey: ['calculationVG'] });
      setShowForm(false);
      toast.success('Veräußerungsgeschäft hinzugefügt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CapitalGain.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGains'] });
      queryClient.invalidateQueries({ queryKey: ['calculationVG'] });
      toast.success('Geschäft gelöscht');
    }
  });

  const handleSubmit = () => {
    if (!formData.description || !formData.acquisition_date) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }
    createMutation.mutate(formData);
  };

  const getSpekulationStatus = (yearsHeld) => {
    if (yearsHeld >= 10) return { label: 'Steuerfrei', color: 'text-green-600', bg: 'bg-green-50' };
    if (yearsHeld >= 5) return { label: 'Warnung: < 10 Jahre', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Steuerpflichtig', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Anlage VG</h1>
          <p className="text-slate-500 mt-1">Veräußerungsgeschäfte - Steuerjahr {taxYear}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Geschäft hinzufügen
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Beschreibung *</Label>
                <Input
                  placeholder="z.B. 'Verkauf Eigentumswohnung München'"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Art des Wirtschaftsguts *</Label>
                <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Veräußerungsdatum *</Label>
                <Input
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Anschaffungsdatum *</Label>
                <Input
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Veräußerungspreis EUR</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Anschaffungskosten EUR</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.acquisition_costs}
                  onChange={(e) => setFormData({ ...formData, acquisition_costs: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Herstellungskosten EUR</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.improvement_costs}
                  onChange={(e) => setFormData({ ...formData, improvement_costs: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Veräußerungskosten EUR</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.selling_costs}
                  onChange={(e) => setFormData({ ...formData, selling_costs: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="exempt"
                    checked={formData.is_tax_exempt}
                    onCheckedChange={(v) => setFormData({ ...formData, is_tax_exempt: v })}
                  />
                  <Label htmlFor="exempt" className="cursor-pointer">Steuerbefreiung (z.B. Selbstnutzung)</Label>
                </div>
              </div>

              {formData.is_tax_exempt && (
                <div className="md:col-span-2">
                  <Label>Grund der Befreiung</Label>
                  <Select value={formData.exemption_reason} onValueChange={(v) => setFormData({ ...formData, exemption_reason: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selbstnutzung">Selbstnutzung Immobilie</SelectItem>
                      <SelectItem value="10_jahre_regel">10-Jahres-Regel</SelectItem>
                      <SelectItem value="600_euro_grenze">600€-Grenze (Private)</SelectItem>
                      <SelectItem value="sonstige">Sonstige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {calculation && (
        <Card className="bg-gradient-to-br from-slate-50 to-purple-50">
          <CardHeader>
            <CardTitle>📊 Berechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-600">Gesamtgewinn</p>
                <p className={`text-lg font-bold ${calculation.totals.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculation.totals.totalGain.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Steuerbefreit</p>
                <p className="text-lg font-bold text-green-600">{calculation.totals.exemptGains.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">600€-Grenze</p>
                <p className="text-lg font-bold">{calculation.threshold.freigrenze}€</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Zu versteuern</p>
                <p className="text-lg font-bold text-red-600">{calculation.totals.taxableAfterThreshold.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gains List */}
      <Card>
        <CardHeader>
          <CardTitle>Veräußerungsgeschäfte ({capitalGains.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {capitalGains.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Geschäfte eingetragen</p>
            ) : (
              capitalGains.map(gain => {
                const yearsHeld = gain.speculation_period || 0;
                const status = getSpekulationStatus(yearsHeld);
                const gainValue = gain.gain_loss || 0;

                return (
                  <div key={gain.id} className={`p-3 border rounded hover:bg-slate-50 ${status.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{gain.description}</p>
                        <p className="text-xs text-slate-500">
                          {gain.acquisition_date} → {gain.sale_date} · {yearsHeld.toFixed(1)} Jahre
                        </p>
                      </div>
                      <div className="text-right mr-4">
                        <div className="flex items-center gap-2">
                          {gainValue >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <p className={`font-bold ${gainValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gainValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                        <p className={`text-xs font-medium mt-1 ${status.color}`}>{status.label}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(gain.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}