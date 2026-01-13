import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Percent, DollarSign } from 'lucide-react';

export default function AdminPricingDiscounts() {
  const queryClient = useQueryClient();
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => base44.entities.Discount.list('-priority')
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingDiscount?.id) {
        return await base44.entities.Discount.update(editingDiscount.id, data);
      } else {
        return await base44.entities.Discount.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setDialogOpen(false);
      setEditingDiscount(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Discount.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    }
  });

  const getDiscountDisplay = (discount) => {
    if (discount.data.discount_type === 'PERCENT') {
      return `${discount.data.discount_value}%`;
    } else if (discount.data.discount_type === 'FIXED_AMOUNT') {
      return `${(discount.data.discount_value / 100).toFixed(2)}€`;
    } else {
      return 'Preis-Override';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Rabatte & Promocodes</h1>
          <p className="text-slate-600 mt-1">Verwalte Rabattaktionen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDiscount(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Rabatt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDiscount ? 'Rabatt bearbeiten' : 'Neuer Rabatt'}</DialogTitle>
            </DialogHeader>
            <DiscountForm
              discount={editingDiscount}
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => {
                setDialogOpen(false);
                setEditingDiscount(null);
              }}
              isSaving={saveMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {discounts.map(discount => {
          const isExpired = discount.data.valid_until && new Date(discount.data.valid_until) < new Date();
          const hasUses = discount.data.max_uses && discount.data.current_uses >= discount.data.max_uses;
          
          return (
            <Card key={discount.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {discount.data.discount_type === 'PERCENT' ? (
                        <Percent className="w-5 h-5 text-slate-400" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-slate-400" />
                      )}
                      <h3 className="text-lg font-light">{discount.data.name}</h3>
                      <Badge variant="secondary" className="font-mono">
                        {discount.data.discount_code}
                      </Badge>
                      {discount.data.is_active ? (
                        <Badge>Aktiv</Badge>
                      ) : (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                      {isExpired && <Badge variant="destructive">Abgelaufen</Badge>}
                      {hasUses && <Badge variant="destructive">Aufgebraucht</Badge>}
                    </div>
                    
                    <p className="text-slate-600 mt-2 text-sm">{discount.data.description}</p>
                    
                    <div className="flex gap-6 mt-3 text-sm">
                      <div>
                        <span className="text-slate-500">Rabatt:</span>{' '}
                        <span className="font-medium text-green-600">{getDiscountDisplay(discount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Gilt für:</span>{' '}
                        <span>{discount.data.applies_to}</span>
                      </div>
                      {discount.data.condition_type !== 'NONE' && (
                        <div>
                          <span className="text-slate-500">Bedingung:</span>{' '}
                          <span>{discount.data.condition_type}</span>
                        </div>
                      )}
                      {discount.data.max_uses && (
                        <div>
                          <span className="text-slate-500">Verwendet:</span>{' '}
                          <span>{discount.data.current_uses || 0} / {discount.data.max_uses}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingDiscount(discount);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Rabatt wirklich löschen?')) {
                          deleteMutation.mutate(discount.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {discounts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-400">
              Noch keine Rabatte erstellt
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DiscountForm({ discount, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(discount?.data || {
    discount_code: '',
    name: '',
    description: '',
    discount_type: 'PERCENT',
    discount_value: 0,
    applies_to: 'ALL',
    applies_to_ids: '[]',
    condition_type: 'NONE',
    condition_value: '{}',
    promo_code: '',
    is_stackable: false,
    priority: 0,
    is_active: false,
    max_uses: null,
    max_uses_per_user: null,
    current_uses: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input
            value={formData.discount_code}
            onChange={(e) => setFormData({ ...formData, discount_code: e.target.value.toUpperCase() })}
            className="uppercase"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rabatt-Typ *</Label>
          <Select value={formData.discount_type} onValueChange={(value) => setFormData({ ...formData, discount_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENT">Prozentrabatt</SelectItem>
              <SelectItem value="FIXED_AMOUNT">Fester Betrag</SelectItem>
              <SelectItem value="OVERRIDE_PRICE">Preis überschreiben</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>
            Wert * {formData.discount_type === 'PERCENT' ? '(%)' : '(€)'}
          </Label>
          <Input
            type="number"
            step={formData.discount_type === 'PERCENT' ? '1' : '0.01'}
            value={formData.discount_type === 'PERCENT' ? formData.discount_value : formData.discount_value / 100}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setFormData({ 
                ...formData, 
                discount_value: formData.discount_type === 'PERCENT' ? value : Math.round(value * 100)
              });
            }}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Gilt für *</Label>
          <Select value={formData.applies_to} onValueChange={(value) => setFormData({ ...formData, applies_to: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Alles</SelectItem>
              <SelectItem value="PRODUCT">Bestimmte Produkte</SelectItem>
              <SelectItem value="TIER">Bestimmte Tarife</SelectItem>
              <SelectItem value="BUNDLE">Bestimmte Bundles</SelectItem>
              <SelectItem value="FEATURE">Bestimmte Features</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Bedingung</Label>
          <Select value={formData.condition_type} onValueChange={(value) => setFormData({ ...formData, condition_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Keine</SelectItem>
              <SelectItem value="MIN_QUANTITY">Min. Menge</SelectItem>
              <SelectItem value="MIN_AMOUNT">Min. Betrag</SelectItem>
              <SelectItem value="BILLING_INTERVAL">Abrechnungsintervall</SelectItem>
              <SelectItem value="FIRST_PURCHASE">Erstkauf</SelectItem>
              <SelectItem value="PROMO_CODE">Promo-Code</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.condition_type === 'PROMO_CODE' && (
        <div className="space-y-2">
          <Label>Promo-Code</Label>
          <Input
            value={formData.promo_code}
            onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
            className="uppercase"
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Priorität</Label>
          <Input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max. Verwendungen</Label>
          <Input
            type="number"
            value={formData.max_uses || ''}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Max. pro User</Label>
          <Input
            type="number"
            value={formData.max_uses_per_user || ''}
            onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value ? parseInt(e.target.value) : null })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label>Aktiv</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={formData.is_stackable}
            onCheckedChange={(checked) => setFormData({ ...formData, is_stackable: checked })}
          />
          <Label>Kombinierbar</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Speichere...' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
}