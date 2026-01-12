import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssetFormDialog({ open, onOpenChange, asset, portfolios, onSubmit }) {
  const [formData, setFormData] = useState(asset || {
    asset_class: 'STOCK',
    quantity: 0,
    purchase_price_avg: 0,
    api_source: 'MANUAL'
  });

  const assetClasses = [
    { value: 'STOCK', label: 'Aktie' },
    { value: 'ETF', label: 'ETF' },
    { value: 'CRYPTO', label: 'Kryptowährung' },
    { value: 'GOLD', label: 'Gold' },
    { value: 'SILVER', label: 'Silber' },
    { value: 'PLATINUM', label: 'Platin' },
    { value: 'OTHER', label: 'Sonstiges' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{asset ? 'Asset bearbeiten' : 'Neues Asset'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Portfolio</Label>
            <Select value={formData.portfolio_id || ''} onValueChange={(val) => setFormData({...formData, portfolio_id: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {portfolios?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Asset-Klasse</Label>
            <Select value={formData.asset_class} onValueChange={(val) => setFormData({...formData, asset_class: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetClasses.map(ac => (
                  <SelectItem key={ac.value} value={ac.value}>{ac.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Name</Label>
            <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ISIN</Label>
              <Input value={formData.isin || ''} onChange={(e) => setFormData({...formData, isin: e.target.value})} />
            </div>
            <div>
              <Label>Symbol</Label>
              <Input value={formData.symbol || ''} onChange={(e) => setFormData({...formData, symbol: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Menge</Label>
              <Input type="number" value={formData.quantity || ''} onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})} />
            </div>
            <div>
              <Label>Ø Kaufpreis (€)</Label>
              <Input type="number" value={formData.purchase_price_avg || ''} onChange={(e) => setFormData({...formData, purchase_price_avg: parseFloat(e.target.value)})} />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button onClick={() => { onSubmit(formData); onOpenChange(false); }} className="bg-slate-700">
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}