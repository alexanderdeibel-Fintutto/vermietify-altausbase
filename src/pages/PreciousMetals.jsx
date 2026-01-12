import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function PreciousMetals() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    portfolio_id: '',
    asset_class: 'GOLD',
    name: '',
    quantity: 0,
    price_per_unit: 0,
    is_physical: true,
    storage_location: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const queryClient = useQueryClient();

  const { data: metals = [] } = useQuery({
    queryKey: ['assets', 'metals'],
    queryFn: async () => {
      const all = await base44.entities.Asset.list();
      return all.filter(a => ['GOLD', 'SILVER', 'PLATINUM'].includes(a.asset_class));
    }
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => base44.entities.Portfolio.list()
  });

  // Gruppiere nach Metall-Typ
  const goldTotal = metals.filter(m => m.asset_class === 'GOLD').reduce((s, m) => s + (m.current_value || 0), 0);
  const silverTotal = metals.filter(m => m.asset_class === 'SILVER').reduce((s, m) => s + (m.current_value || 0), 0);
  const platinumTotal = metals.filter(m => m.asset_class === 'PLATINUM').reduce((s, m) => s + (m.current_value || 0), 0);

  const addMutation = useMutation({
    mutationFn: async (data) => {
      const asset = await base44.entities.Asset.create({
        portfolio_id: data.portfolio_id,
        asset_class: data.asset_class,
        name: data.name,
        symbol: data.asset_class === 'GOLD' ? 'XAU' : data.asset_class === 'SILVER' ? 'XAG' : 'XPT',
        quantity: data.quantity,
        purchase_price_avg: data.price_per_unit,
        is_physical: data.is_physical,
        storage_location: data.storage_location,
        tax_holding_period_start: data.transaction_date,
        api_source: 'METALS_API'
      });
      
      await base44.entities.AssetTransaction.create({
        asset_id: asset.id,
        transaction_type: 'BUY',
        transaction_date: data.transaction_date,
        quantity: data.quantity,
        price_per_unit: data.price_per_unit,
        total_amount: data.quantity * data.price_per_unit,
        fees: 0,
        tax_relevant: false,
        tax_year: new Date(data.transaction_date).getFullYear()
      });
      
      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['assets']);
      toast.success('Bestand hinzugefügt');
      setDialogOpen(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Edelmetalle</h1>
          <p className="text-slate-600 mt-1">{metals.length} Bestände</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Bestand hinzufügen
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🥇</span>
              Gold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{goldTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            <p className="text-sm text-slate-600 mt-1">
              {metals.filter(m => m.asset_class === 'GOLD').reduce((s, m) => s + m.quantity, 0).toFixed(2)} Gramm
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-300 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">🥈</span>
              Silber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{silverTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            <p className="text-sm text-slate-600 mt-1">
              {metals.filter(m => m.asset_class === 'SILVER').reduce((s, m) => s + m.quantity, 0).toFixed(2)} Gramm
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">💎</span>
              Platin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{platinumTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            <p className="text-sm text-slate-600 mt-1">
              {metals.filter(m => m.asset_class === 'PLATINUM').reduce((s, m) => s + m.quantity, 0).toFixed(2)} Gramm
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bestände</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3">Metall</th>
                  <th className="text-left p-3">Bezeichnung</th>
                  <th className="text-right p-3">Gewicht (g)</th>
                  <th className="text-right p-3">Kaufpreis</th>
                  <th className="text-right p-3">Aktuell</th>
                  <th className="text-left p-3">Lagerort</th>
                  <th className="text-right p-3">Wert</th>
                </tr>
              </thead>
              <tbody>
                {metals.map(metal => (
                  <tr key={metal.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      <Badge variant="outline">
                        {metal.asset_class === 'GOLD' ? '🥇 Gold' : 
                         metal.asset_class === 'SILVER' ? '🥈 Silber' : 
                         '💎 Platin'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {metal.name}
                      {metal.is_physical && <Badge variant="outline" className="ml-2 text-xs">Physisch</Badge>}
                    </td>
                    <td className="text-right p-3">{metal.quantity.toFixed(2)}</td>
                    <td className="text-right p-3">{(metal.purchase_price_avg || 0).toFixed(2)}€/g</td>
                    <td className="text-right p-3">{(metal.current_price || 0).toFixed(2)}€/g</td>
                    <td className="p-3">
                      {metal.storage_location && (
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {metal.storage_location}
                        </div>
                      )}
                    </td>
                    <td className="text-right p-3 font-medium">
                      {(metal.current_value || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edelmetall-Bestand hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Portfolio *</Label>
              <Select value={formData.portfolio_id} onValueChange={v => setFormData({...formData, portfolio_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Portfolio wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Metall *</Label>
              <Select value={formData.asset_class} onValueChange={v => setFormData({...formData, asset_class: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOLD">🥇 Gold</SelectItem>
                  <SelectItem value="SILVER">🥈 Silber</SelectItem>
                  <SelectItem value="PLATINUM">💎 Platin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Bezeichnung *</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="z.B. Goldbarren 100g Heraeus"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gewicht (Gramm) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Preis pro Gramm *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={e => setFormData({...formData, price_per_unit: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label>Lagerort</Label>
              <Input
                value={formData.storage_location}
                onChange={e => setFormData({...formData, storage_location: e.target.value})}
                placeholder="z.B. Schließfach Bank XY, Safe zuhause"
              />
            </div>

            <div>
              <Label>Kaufdatum *</Label>
              <Input
                type="date"
                value={formData.transaction_date}
                onChange={e => setFormData({...formData, transaction_date: e.target.value})}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
              <Button 
                onClick={() => addMutation.mutate(formData)}
                disabled={!formData.portfolio_id || !formData.name || formData.quantity <= 0}
              >
                Hinzufügen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}