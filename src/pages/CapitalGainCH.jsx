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
import { Plus, Trash2, Download } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function CapitalGainCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('ZH');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    asset_type: 'aktien',
    sale_date: new Date().toISOString().split('T')[0],
    acquisition_date: new Date().toISOString().split('T')[0],
    sale_price: 0,
    acquisition_cost: 0,
    selling_cost: 0,
    canton,
    tax_year: taxYear
  });

  const queryClient = useQueryClient();

  const { data: capitalGains = [] } = useQuery({
    queryKey: ['capitalGainsCH', taxYear, canton],
    queryFn: () => base44.entities.CapitalGainCH.filter({ tax_year: taxYear, canton }) || []
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const saleDate = new Date(data.sale_date);
      const acqDate = new Date(data.acquisition_date);
      const holdingDays = Math.floor((saleDate - acqDate) / (1000 * 60 * 60 * 24));
      
      return base44.entities.CapitalGainCH.create({
        ...data,
        holding_period_days: holdingDays,
        is_short_term: holdingDays < 365,
        capital_gain: data.sale_price - data.acquisition_cost - data.selling_cost,
        tax_year: taxYear,
        canton
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGainsCH', taxYear, canton] });
      setShowForm(false);
      setFormData({
        description: '',
        asset_type: 'aktien',
        sale_date: new Date().toISOString().split('T')[0],
        acquisition_date: new Date().toISOString().split('T')[0],
        sale_price: 0,
        acquisition_cost: 0,
        selling_cost: 0,
        canton,
        tax_year: taxYear
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CapitalGainCH.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capitalGainsCH', taxYear, canton] });
    }
  });

  const handleSubmit = async () => {
    if (!formData.description || formData.sale_price <= 0) return;
    await createMutation.mutateAsync(formData);
  };

  const totalGains = capitalGains.reduce((s, cg) => s + (cg.capital_gain || 0), 0);
  const shortTermGains = capitalGains.filter(cg => cg.is_short_term).reduce((s, cg) => s + (cg.capital_gain || 0), 0);
  const longTermGains = capitalGains.filter(cg => !cg.is_short_term).reduce((s, cg) => s + (cg.capital_gain || 0), 0);

  const assetTypes = {
    'aktien': 'Aktien',
    'anleihen': 'Anleihen',
    'fonds': 'Fonds',
    'etf': 'ETF',
    'immobilie': 'Immobilie',
    'grundstueck': 'Grundstück',
    'kryptowährung': 'Kryptowährung',
    'sonstige': 'Sonstige'
  };

  const cantons = ['ZH', 'BE', 'LU', 'AG', 'SG', 'BS', 'BL', 'VD', 'GE', 'VS', 'NE', 'JU', 'SO', 'SH', 'TG', 'TI', 'GR', 'AR', 'AI', 'GL', 'OW', 'NW', 'UR', 'ZG'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kursgewinne & Veräußerungen</h1>
          <p className="text-slate-500 mt-1">Schweiz Steuerjahr {taxYear} - Kanton {canton}</p>
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

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={canton} onValueChange={setCanton}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cantons.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Gesamtgewinne</p>
              <p className="text-2xl font-bold">CHF {totalGains.toLocaleString('de-CH')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Kurzfristig (&lt;1 Jahr)</p>
              <p className={`text-2xl font-bold ${shortTermGains > 0 ? 'text-orange-600' : 'text-slate-600'}`}>
                CHF {shortTermGains.toLocaleString('de-CH')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Langfristig (≥1 Jahr)</p>
              <p className="text-2xl font-bold text-green-600">CHF {longTermGains.toLocaleString('de-CH')}</p>
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
                <label className="text-sm font-medium">Art</label>
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
                <label className="text-sm font-medium">Kaufdatum</label>
                <Input
                  type="date"
                  value={formData.acquisition_date}
                  onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Verkaufsdatum</label>
                <Input
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Anschaffungskosten (CHF)</label>
                <Input
                  type="number"
                  value={formData.acquisition_cost}
                  onChange={(e) => setFormData({ ...formData, acquisition_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Verkaufspreis (CHF)</label>
                <Input
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Verkaufskosten (CHF)</label>
              <Input
                type="number"
                value={formData.selling_cost}
                onChange={(e) => setFormData({ ...formData, selling_cost: parseFloat(e.target.value) || 0 })}
              />
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
          const holdingDays = cg.holding_period_days || 0;
          const gain = cg.capital_gain || 0;
          
          return (
            <Card key={cg.id} className={cg.is_short_term ? 'border-orange-300' : 'border-slate-200'}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{cg.description}</h3>
                      <Badge className={cg.is_short_term ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                        {cg.is_short_term ? '⚠️ Kurzfristig' : '✅ Langfristig'}
                      </Badge>
                      <Badge variant="outline">
                        {gain > 0 ? `Gewinn: CHF ${gain.toLocaleString('de-CH')}` : `Verlust: CHF ${Math.abs(gain).toLocaleString('de-CH')}`}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{assetTypes[cg.asset_type]} • Haltedauer: {Math.floor(holdingDays / 365)}J {Math.floor((holdingDays % 365) / 30)}M</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Kaufpreis:</span>
                        <p className="font-semibold">CHF {(cg.acquisition_cost || 0).toLocaleString('de-CH')}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Verkaufspreis:</span>
                        <p className="font-semibold">CHF {(cg.sale_price || 0).toLocaleString('de-CH')}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Gewinn/Verlust:</span>
                        <p className={`font-semibold ${gain > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          CHF {gain.toLocaleString('de-CH')}
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
            Keine Veräußerungen erfasst.
          </div>
        )}
      </div>
    </div>
  );
}