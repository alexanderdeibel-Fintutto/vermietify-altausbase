import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CryptoFormDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    coingecko_id: '',
    blockchain: '',
    token_type: 'NATIVE',
    wallet_type: 'EXCHANGE',
    exchange_name: '',
    current_price_eur: '',
    is_staking: false,
    staking_apy: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      current_price_eur: formData.current_price_eur ? parseFloat(formData.current_price_eur) : null,
      staking_apy: formData.staking_apy ? parseFloat(formData.staking_apy) : null,
      current_price_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Kryptowährung hinzufügen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="symbol">Symbol *</Label>
              <Input
                id="symbol"
                placeholder="z.B. BTC"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Bitcoin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="blockchain">Blockchain</Label>
              <Input
                id="blockchain"
                placeholder="z.B. Bitcoin, Ethereum"
                value={formData.blockchain}
                onChange={(e) => setFormData({ ...formData, blockchain: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="token_type">Token-Typ</Label>
              <Select value={formData.token_type} onValueChange={(v) => setFormData({ ...formData, token_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIVE">Native</SelectItem>
                  <SelectItem value="ERC20">ERC20</SelectItem>
                  <SelectItem value="BEP20">BEP20</SelectItem>
                  <SelectItem value="SPL">SPL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wallet_type">Lagerort</Label>
              <Select value={formData.wallet_type} onValueChange={(v) => setFormData({ ...formData, wallet_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOT_WALLET">Hot Wallet</SelectItem>
                  <SelectItem value="COLD_WALLET">Cold Wallet</SelectItem>
                  <SelectItem value="EXCHANGE">Börse</SelectItem>
                  <SelectItem value="DEFI">DeFi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="exchange_name">Börse/Plattform</Label>
              <Input
                id="exchange_name"
                placeholder="z.B. Kraken, Binance"
                value={formData.exchange_name}
                onChange={(e) => setFormData({ ...formData, exchange_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Kurs in EUR</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="z.B. 45000.50"
                value={formData.current_price_eur}
                onChange={(e) => setFormData({ ...formData, current_price_eur: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="staking_apy">Staking APY (%)</Label>
              <Input
                id="staking_apy"
                type="number"
                step="0.01"
                placeholder="z.B. 4.5"
                disabled={!formData.is_staking}
                value={formData.staking_apy}
                onChange={(e) => setFormData({ ...formData, staking_apy: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Input
              id="notes"
              placeholder="z.B. HODL-Position"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}