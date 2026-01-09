import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Download, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AnlageVGDE() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    asset_type: 'wertpapier',
    sale_date: new Date().toISOString().split('T')[0],
    acquisition_date: new Date().toISOString().split('T')[0],
    sale_price: 0,
    acquisition_cost: 0,
    improvement_cost: 0,
    selling_cost: 0,
    is_tax_exempt: false,
    exemption_reason: 'privatvermoegen',
    tax_year: taxYear
  });

  const queryClient = useQueryClient();

  const { data: capitalGains = [] } = useQuery({
    queryKey: ['capitalGainsDE', taxYear],
    queryFn: () => base44.entities.CapitalGainAT.filter({ tax_year: taxYear }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const saleDate = new Date(data.sale_date);
      const acqDate = new Date(data.acquisition_date);
      const holdingYears = (saleDate - acqDate) / (1000 * 60 * 60 * 24 * 365);
      
      return base44.entities.CapitalGainAT.create({
        ...data,
        holding_period_years: holdingYears,
        gain_loss: data.sale_price - data.acquisition_cost - data.improvement_cost - data.selling_cost,
        tax_year: taxYear
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGainsDE', taxYear] });
      setShowForm(false);
      setFormData({
        description: '',
        asset_type: 'wertpapier',
        sale_date: new Date().toISOString().split('T')[0],
        acquisition_date: new Date().toISOString().split('T')[0],
        sale_price: 0,
        acquisition_cost: 0,
        improvement_cost: 0,
        selling_cost: 0,
        is_tax_exempt: false,
        exemption_reason: 'privatvermoegen',
        tax_year: taxYear
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CapitalGainAT.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGainsDE', taxYear] });
    }
  });

  const handleSubmit = async () => {
    if (!formData.description || formData.sale_price <= 0) return;
    await createMutation.mutateAsync(formData);
  };

  const taxableGains = capitalGains
    .filter(cg => !cg.is_tax_exempt)
    .reduce((s, cg) => s + Math.max(0, cg.gain_loss || 0), 0);
  
  const totalCosts = capitalGains.reduce((s, cg) => s + (cg.acquisition_cost || 0), 0);
  const totalProceeds = capitalGains.reduce((s, cg) => s + (cg.sale_price || 0), 0);

  const assetTypes = {
    'immobilie': 'Immobilie',
    'grundstueck': 'Grundstück',
    'wertpapier': 'Wertpapier',
    'kryptow%C3%A4hrung': 'Kryptowährung',
    'beteiligung': 'Beteiligung',
    'sonstige': 'Sonstige'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anlage VG - Veräußerungsgewinne</h1>
          <p className="text-slate-500 mt-1">Deutschland Steuerjahr {taxYear}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Hinzufügen
          </Button>
          <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4" /> PDF Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Verkaufserlöse</p>
              <p className="text-2xl font-bold">€{totalProceeds.toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Anschaffungskosten</p>
              <p className="text-2xl font-bold">€{totalCosts.toLocaleString('de-DE')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Steuerpflichtige Gewinne</p>
              <p className="text-2xl font-bold text-green-600">€{taxableGains.toLocaleString('de-DE')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle>Neue Veräußerung erfassen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Art des Vermögenswertes</label>
                <Select value={formData.asset_type} onValueChange={(v) => setFormData({ ...formData, asset_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(assetTypes).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Beschreibung</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="z.B. Aktien XYZ"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Anschaffungsdatum</label>
                <Input
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Veräußerungsdatum</label>
                <Input
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Anschaffungskosten (€)</label>
                <Input
                  type="number"
                  value={formData.acquisition_cost}
                  onChange={(e) => setFormData({ ...formData, acquisition_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Verkaufspreis (€)</label>
                <Input
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Herstellungskosten (€)</label>
                <Input
                  type="number"
                  value={formData.improvement_cost}
                  onChange={(e) => setFormData({ ...formData, improvement_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Veräußerungskosten (€)</label>
                <Input
                  type="number"
                  value={formData.selling_cost}
                  onChange={(e) => setFormData({ ...formData, selling_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">
                Speichern
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {capitalGains.map((cg) => {
          const gain = (cg.gain_loss || 0);
          const holdingYears = cg.holding_period_years || 0;
          const isExempt = cg.is_tax_exempt;
          
          return (
            <Card key={cg.id} className={isExempt ? 'border-yellow-300' : 'border-slate-200'}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{cg.description}</h3>
                      <Badge className={isExempt ? 'bg-yellow-100 text-yellow-800' : gain > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {isExempt ? '🔒 Steuerfrei' : gain > 0 ? `✅ Gewinn: €${gain.toLocaleString('de-DE')}` : `⚠️ Verlust: €${Math.abs(gain).toLocaleString('de-DE')}`}
                      </Badge>
                      {isExempt && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{assetTypes[cg.asset_type]} • Haltedauer: {holdingYears.toFixed(1)} Jahre</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Kaufpreis:</span>
                        <p className="font-semibold">€{(cg.acquisition_cost || 0).toLocaleString('de-DE')}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Verkaufspreis:</span>
                        <p className="font-semibold">€{(cg.sale_price || 0).toLocaleString('de-DE')}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Gewinn/Verlust:</span>
                        <p className={`font-semibold ${gain > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          €{gain.toLocaleString('de-DE')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteMutation.mutate(cg.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {capitalGains.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Keine Veräußerungen erfasst. Klicken Sie auf "Hinzufügen" um zu starten.
          </div>
        )}
      </div>
    </div>
  );
}