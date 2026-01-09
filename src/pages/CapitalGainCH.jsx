import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const CANTONS = ['ZH', 'BE', 'LU', 'AG', 'SG', 'BS', 'BL', 'VD', 'GE', 'VS', 'NE', 'JU', 'SO', 'SH', 'TG', 'TI', 'GR', 'AR', 'AI', 'GL', 'OW', 'NW', 'UR', 'ZG'];
const ASSET_TYPES = ['aktien', 'anleihen', 'fonds', 'immobilie', 'kryptowährung', 'rohstoffe', 'sonstige'];

export default function CapitalGainCH() {
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [canton, setCanton] = useState('ZH');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  const { data: gains = [] } = useQuery({
    queryKey: ['capitalGainsCH', taxYear, canton],
    queryFn: async () => {
      const investments = await base44.entities.InvestmentCH.filter({ tax_year: taxYear, canton }) || [];
      return investments.filter(i => (i.capital_gains || 0) !== 0 || (i.capital_losses || 0) !== 0);
    },
    enabled: !!canton
  });

  const totals = {
    gains: gains.filter(g => (g.capital_gains || 0) > 0).reduce((s, g) => s + (g.capital_gains || 0), 0),
    losses: Math.abs(gains.filter(g => (g.capital_losses || 0) < 0).reduce((s, g) => s + (g.capital_losses || 0), 0)),
    net: gains.reduce((s, g) => s + ((g.capital_gains || 0) - (g.capital_losses || 0)), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📈 Kursgewinne Schweiz</h1>
          <p className="text-slate-500 mt-1">Realisierte Gewinne und Verluste aus Wertschriften</p>
        </div>
        <div className="flex gap-2">
          <Select value={canton} onValueChange={setCanton}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANTONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gewinne</p>
            <p className="text-3xl font-bold mt-2 text-green-600">CHF {totals.gains.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Verluste</p>
            <p className="text-3xl font-bold mt-2 text-red-600">CHF {totals.losses.toLocaleString('de-CH')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Netto</p>
            <p className={`text-3xl font-bold mt-2 ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              CHF {totals.net.toLocaleString('de-CH')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Positionen</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">{gains.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-2">
        {gains.length > 0 ? (
          gains.map(gain => {
            const totalGain = (gain.capital_gains || 0) - (gain.capital_losses || 0);
            return (
              <Card key={gain.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold">{gain.title}</h3>
                      <p className="text-sm text-slate-600">{gain.investment_type}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge>{gain.quantity} Stk.</Badge>
                        {gain.isin && <Badge variant="outline">{gain.isin}</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Gewinn/Verlust</p>
                      <p className={`text-lg font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        CHF {totalGain.toLocaleString('de-CH')}
                      </p>
                      {gain.capital_gains > 0 && (
                        <p className="text-xs text-green-600">Gewinn: CHF {gain.capital_gains.toLocaleString('de-CH')}</p>
                      )}
                      {gain.capital_losses > 0 && (
                        <p className="text-xs text-red-600">Verlust: CHF {gain.capital_losses.toLocaleString('de-CH')}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Keine Kursgewinne/Verluste erfasst
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}