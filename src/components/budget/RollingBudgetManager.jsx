import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RollingBudgetManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    budget_name: '',
    budget_type: 'monthly',
    rolling_periods: 12,
    categories: [{ category_name: '', base_amount: 0, growth_rate: 0 }]
  });

  const { data: budgets, isLoading, refetch } = useQuery({
    queryKey: ['rollingBudgets'],
    queryFn: async () => {
      try {
        return await base44.entities.RollingBudget.list('-created_at', 50);
      } catch {
        return [];
      }
    }
  });

  const handleCreateBudget = async () => {
    try {
      if (!formData.budget_name || formData.categories.some(c => !c.category_name)) {
        toast.error('Bitte alle Felder ausfüllen');
        return;
      }

      await base44.asServiceRole.entities.RollingBudget.create({
        ...formData,
        user_email: (await base44.auth.me()).email,
        created_at: new Date().toISOString()
      });

      toast.success('Rollendes Budget erstellt');
      resetForm();
      setShowDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      budget_name: '',
      budget_type: 'monthly',
      rolling_periods: 12,
      categories: [{ category_name: '', base_amount: 0, growth_rate: 0 }]
    });
    setEditingBudget(null);
  };

  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, { category_name: '', base_amount: 0, growth_rate: 0 }]
    });
  };

  const updateCategory = (index, field, value) => {
    const updated = [...formData.categories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, categories: updated });
  };

  const removeCategory = (index) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rollendes Budget erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Name</Label>
                <Input
                  value={formData.budget_name}
                  onChange={(e) => setFormData({ ...formData, budget_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Budgettyp</Label>
                <select
                  value={formData.budget_type}
                  onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  <option value="monthly">Monatlich</option>
                  <option value="quarterly">Vierteljährlich</option>
                  <option value="semi-annual">Halbjährlich</option>
                </select>
              </div>
              <div className="col-span-2">
                <Label className="text-sm">Rollierende Perioden</Label>
                <Input
                  type="number"
                  min="3"
                  max="36"
                  value={formData.rolling_periods}
                  onChange={(e) => setFormData({ ...formData, rolling_periods: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Kategorien</Label>
                <Button size="sm" onClick={addCategory} variant="outline">
                  <Plus className="w-3 h-3 mr-1" /> Kategorie
                </Button>
              </div>

              <div className="space-y-2">
                {formData.categories.map((cat, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="Kategoriename"
                      value={cat.category_name}
                      onChange={(e) => updateCategory(idx, 'category_name', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Basisbetrag"
                      value={cat.base_amount}
                      onChange={(e) => updateCategory(idx, 'base_amount', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Wachstum %"
                      step="0.1"
                      value={cat.growth_rate}
                      onChange={(e) => updateCategory(idx, 'growth_rate', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCategory(idx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleCreateBudget} className="flex-1 bg-blue-600">
                Erstellen
              </Button>
              <Button onClick={() => { setShowDialog(false); resetForm(); }} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
          className="bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-1" />
          Neues Budget
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : budgets && budgets.length > 0 ? (
        <div className="space-y-3">
          {budgets.map(budget => (
            <Card key={budget.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{budget.budget_name}</p>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-xs text-slate-600">
                      <p>Typ: {budget.budget_type}</p>
                      <p>Perioden: {budget.rolling_periods}</p>
                      <p>Kategorien: {budget.categories?.length || 0}</p>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {budget.categories?.slice(0, 3).map((cat, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 rounded px-2 py-1">
                          {cat.category_name}
                        </span>
                      ))}
                      {budget.categories?.length > 3 && (
                        <span className="text-xs bg-slate-100 rounded px-2 py-1">
                          +{budget.categories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-slate-600">Keine rollierenden Budgets vorhanden</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}