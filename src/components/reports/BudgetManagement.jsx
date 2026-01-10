import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'income', label: 'Einnahmen', color: 'text-green-600' },
  { value: 'expense', label: 'Ausgaben', color: 'text-red-600' },
  { value: 'maintenance', label: 'Wartung', color: 'text-blue-600' },
  { value: 'utilities', label: 'Nebenkosten', color: 'text-orange-600' },
  { value: 'insurance', label: 'Versicherung', color: 'text-purple-600' },
  { value: 'taxes', label: 'Steuern', color: 'text-yellow-600' },
  { value: 'general', label: 'Allgemein', color: 'text-slate-600' }
];

export default function BudgetManagement() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    building_id: '',
    category: 'general',
    planned_amount: '',
    period: 'yearly',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets', year],
    queryFn: () => base44.entities.Budget.filter({ year: parseInt(year), is_active: true })
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', year],
    queryFn: () => base44.entities.Payment.list()
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items', year],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setShowDialog(false);
      setFormData({
        name: '',
        year: new Date().getFullYear(),
        building_id: '',
        category: 'general',
        planned_amount: '',
        period: 'yearly',
        notes: ''
      });
      toast.success('Budget erstellt');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      planned_amount: parseFloat(formData.planned_amount)
    });
  };

  const calculateActual = (budget) => {
    if (budget.category === 'income') {
      const yearPayments = payments.filter(p => 
        new Date(p.payment_date).getFullYear().toString() === year &&
        p.status === 'paid' &&
        (!budget.building_id || p.building_id === budget.building_id)
      );
      return yearPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    } else {
      const yearExpenses = financialItems.filter(item => 
        new Date(item.date).getFullYear().toString() === year &&
        item.type === 'expense' &&
        (!budget.building_id || item.building_id === budget.building_id)
      );
      return yearExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
  };

  const budgetsWithActual = budgets.map(budget => ({
    ...budget,
    actual: calculateActual(budget),
    percentage: calculateActual(budget) / budget.planned_amount * 100
  }));

  const totalPlanned = budgets.reduce((sum, b) => sum + b.planned_amount, 0);
  const totalActual = budgetsWithActual.reduce((sum, b) => sum + b.actual, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Budget hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Budget erstellen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Budget-Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Wartungsbudget 2026"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Jahr</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Zeitraum</Label>
                  <Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="quarterly">Quartalsweise</SelectItem>
                      <SelectItem value="yearly">Jährlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Kategorie</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Gebäude (optional)</Label>
                <Select value={formData.building_id} onValueChange={(v) => setFormData({ ...formData, building_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gesamtbudget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Gesamtbudget</SelectItem>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Geplanter Betrag (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.planned_amount}
                  onChange={(e) => setFormData({ ...formData, planned_amount: e.target.value })}
                  placeholder="10000"
                  required
                />
              </div>

              <div>
                <Label>Notizen</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Erstelle...' : 'Budget erstellen'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamt Budget</p>
                <p className="text-2xl font-bold">
                  {totalPlanned.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tatsächlich</p>
                <p className="text-2xl font-bold">
                  {totalActual.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Auslastung</p>
                <p className="text-2xl font-bold">
                  {totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetsWithActual.map(budget => {
          const categoryInfo = CATEGORIES.find(c => c.value === budget.category);
          const building = buildings.find(b => b.id === budget.building_id);
          const isOverBudget = budget.percentage > 100;
          const isWarning = budget.percentage > 80 && budget.percentage <= 100;

          return (
            <Card key={budget.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{budget.name}</span>
                  <Badge variant={isOverBudget ? 'destructive' : isWarning ? 'outline' : 'default'}>
                    {budget.percentage.toFixed(0)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={categoryInfo?.color}>{categoryInfo?.label}</span>
                  <span className="text-slate-500">{building?.name || 'Gesamt'}</span>
                </div>

                <Progress value={Math.min(budget.percentage, 100)} className="h-2" />

                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-slate-600">Tatsächlich</p>
                    <p className="font-semibold">
                      {budget.actual.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600">Geplant</p>
                    <p className="font-semibold">
                      {budget.planned_amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  {budget.notes && <p className="italic">{budget.notes}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Keine Budgets für {year}</p>
            <p className="text-sm text-slate-500 mt-2">Erstellen Sie Ihr erstes Budget</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}