import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categories = {
  income: [
    { value: 'rent_income', label: 'Mieteinnahmen' },
    { value: 'deposit_return', label: 'Kaution Rückgabe' },
    { value: 'other_income', label: 'Sonstige Einnahmen' }
  ],
  expense: [
    { value: 'maintenance', label: 'Wartung' },
    { value: 'utilities', label: 'Nebenkosten' },
    { value: 'insurance', label: 'Versicherung' },
    { value: 'property_tax', label: 'Grundsteuer' },
    { value: 'personnel', label: 'Personal' },
    { value: 'office', label: 'Bürobedarf' },
    { value: 'other_expense', label: 'Sonstige Ausgaben' }
  ]
};

export default function FinancialTransactionForm({ buildings = [], contracts = [], costCenters = [], equipment = [], onSubmit }) {
  const [formData, setFormData] = useState({
    transaction_type: 'income',
    category: 'rent_income',
    description: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    building_id: '',
    contract_id: '',
    equipment_id: '',
    cost_center_id: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.description.trim()) newErrors.description = 'Beschreibung erforderlich';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Betrag erforderlich';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });

    setFormData({
      transaction_type: 'income',
      category: 'rent_income',
      description: '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      building_id: '',
      contract_id: '',
      equipment_id: '',
      cost_center_id: '',
      payment_method: 'bank_transfer',
      notes: ''
    });
    setErrors({});
  };

  const currentCategories = categories[formData.transaction_type] || [];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-light text-slate-900 mb-6">Finanztransaktion erfassen</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-light text-slate-700">Transaktionstyp *</label>
            <Select value={formData.transaction_type} onValueChange={(value) => {
              setFormData({ ...formData, transaction_type: value, category: categories[value][0].value });
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">📊 Einnahme</SelectItem>
                <SelectItem value="expense">📉 Ausgabe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Kategorie *</label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-light text-slate-700">Beschreibung *</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="z.B. Miete November 2025"
            className="mt-1 font-light"
            rows={2}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1 font-light">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-light text-slate-700">Betrag (EUR) *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="mt-1 font-light"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1 font-light">{errors.amount}</p>}
          </div>

          <div>
            <label className="text-sm font-light text-slate-700">Transaktionsdatum *</label>
            <Input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              className="mt-1 font-light"
            />
          </div>
        </div>

        {/* Entity Links */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-light text-slate-700 mb-3">Verknüpfungen (optional)</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {buildings.length > 0 && (
              <div>
                <label className="text-xs font-light text-slate-600">Gebäude</label>
                <Select value={formData.building_id} onValueChange={(value) => setFormData({ ...formData, building_id: value })}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Keine</SelectItem>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {contracts.length > 0 && (
              <div>
                <label className="text-xs font-light text-slate-600">Mietvertrag</label>
                <Select value={formData.contract_id} onValueChange={(value) => setFormData({ ...formData, contract_id: value })}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Keine</SelectItem>
                    {contracts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {equipment.length > 0 && (
              <div>
                <label className="text-xs font-light text-slate-600">Gerät</label>
                <Select value={formData.equipment_id} onValueChange={(value) => setFormData({ ...formData, equipment_id: value })}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Keine</SelectItem>
                    {equipment.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {costCenters.length > 0 && (
              <div>
                <label className="text-xs font-light text-slate-600">Kostenstelle</label>
                <Select value={formData.cost_center_id} onValueChange={(value) => setFormData({ ...formData, cost_center_id: value })}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Keine</SelectItem>
                    {costCenters.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-light text-slate-700">Zahlungsmethode</label>
          <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
              <SelectItem value="cash">Bar</SelectItem>
              <SelectItem value="check">Scheck</SelectItem>
              <SelectItem value="credit_card">Kreditkarte</SelectItem>
              <SelectItem value="other">Sonstige</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-light text-slate-700">Notizen</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optionale Notizen..."
            className="mt-1 font-light"
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 font-light">
            Transaktion erfassen
          </Button>
        </div>
      </form>
    </Card>
  );
}