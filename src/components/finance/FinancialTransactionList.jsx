import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoryLabels = {
  rent_income: '🏠 Mieteinnahmen',
  deposit_return: '💰 Kaution Rückgabe',
  other_income: '📊 Sonstige Einnahmen',
  maintenance: '🔧 Wartung',
  utilities: '💡 Nebenkosten',
  insurance: '🛡️ Versicherung',
  property_tax: '📋 Grundsteuer',
  personnel: '👤 Personal',
  office: '📎 Bürobedarf',
  other_expense: '📉 Sonstige Ausgaben'
};

const typeColors = {
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-700'
};

export default function FinancialTransactionList({ transactions = [], buildings = {}, contracts = {}, equipment = {} }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(trans => {
      const matchesSearch = !searchQuery || 
        trans.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || trans.transaction_type === filterType;
      const matchesCategory = !filterCategory || trans.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchQuery, filterType, filterCategory]);

  const categories = [...new Set(transactions.map(t => t.category))];
  const totals = {
    income: filtered.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0),
    expense: filtered.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
  };

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Transaktionen vorhanden</p>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Input
            placeholder="Transaktion durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="font-light"
          />

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Typen</SelectItem>
              <SelectItem value="income">📊 Einnahmen</SelectItem>
              <SelectItem value="expense">📉 Ausgaben</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Kategorien</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="p-4">
          <p className="text-xs font-light text-green-600 uppercase">Einnahmen</p>
          <p className="text-2xl font-light text-slate-900 mt-1">+{totals.income.toFixed(2)} €</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-light text-red-600 uppercase">Ausgaben</p>
          <p className="text-2xl font-light text-slate-900 mt-1">-{totals.expense.toFixed(2)} €</p>
        </Card>
      </div>

      {/* Transactions */}
      <div className="space-y-2">
        {filtered.map(trans => (
          <Card key={trans.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-light text-slate-900">{trans.description}</h4>
                  <Badge className={typeColors[trans.transaction_type]}>
                    {trans.transaction_type === 'income' ? '+' : '-'}{trans.amount.toFixed(2)} €
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className={statusColors[trans.status] || statusColors.completed}>
                    {categoryLabels[trans.category]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 text-xs">
                  <div>
                    <p className="text-slate-500 font-light">Datum</p>
                    <p className="font-light text-slate-900">
                      {format(new Date(trans.transaction_date), 'd. MMM yyyy', { locale: de })}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 font-light">Zahlungsart</p>
                    <p className="font-light text-slate-900 capitalize">{trans.payment_method}</p>
                  </div>

                  {trans.building_id && buildings[trans.building_id] && (
                    <div>
                      <p className="text-slate-500 font-light">Gebäude</p>
                      <p className="font-light text-slate-900">{buildings[trans.building_id].name}</p>
                    </div>
                  )}

                  {trans.cost_center_id && (
                    <div>
                      <p className="text-slate-500 font-light">Kostenstelle</p>
                      <p className="font-light text-slate-900">{trans.cost_center_id}</p>
                    </div>
                  )}
                </div>

                {trans.notes && <p className="text-xs text-slate-600 font-light mt-2 italic">{trans.notes}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}