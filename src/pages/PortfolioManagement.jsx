import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TrendingUp, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PortfolioManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_taxable: true,
    tax_jurisdiction: 'DE'
  });
  const queryClient = useQueryClient();

  const { data: portfolios = [], isLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => base44.entities.Portfolio.list('-updated_date')
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['asset-holdings'],
    queryFn: () => base44.entities.AssetHolding.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Portfolio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      setShowForm(false);
      setFormData({ name: '', description: '', is_taxable: true, tax_jurisdiction: 'DE' });
      toast.success('Portfolio erstellt');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Portfolio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      setShowForm(false);
      setEditingPortfolio(null);
      setFormData({ name: '', description: '', is_taxable: true, tax_jurisdiction: 'DE' });
      toast.success('Portfolio aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Portfolio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success('Portfolio gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Portfolioname erforderlich');
      return;
    }

    if (editingPortfolio) {
      updateMutation.mutate({ id: editingPortfolio.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (portfolio) => {
    setEditingPortfolio(portfolio);
    setFormData({
      name: portfolio.name,
      description: portfolio.description || '',
      is_taxable: portfolio.is_taxable,
      tax_jurisdiction: portfolio.tax_jurisdiction
    });
    setShowForm(true);
  };

  const getPortfolioValue = (portfolioId) => {
    return holdings
      .filter(h => h.portfolio_account_id) // TODO: Verknüpfung Portfolio
      .reduce((sum, h) => sum + (h.current_value || 0), 0);
  };

  if (isLoading) {
    return <div className="text-center py-8">Lädt...</div>;
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            Kapitalanlagen & Vermögensverwaltung
          </h1>
          <p className="text-slate-600 mt-1">Verwalten Sie Ihre Wertpapiere und Vermögenswerte</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Neues Portfolio
        </Button>
      </div>

      {/* Gesamtvermögen Card */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Gesamtvermögen</p>
              <p className="text-4xl font-bold text-emerald-900 mt-2">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                }).format(totalValue)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-emerald-600 opacity-20" />
          </div>
        </CardContent>
      </Card>

      {/* Portfolio List */}
      <div className="grid gap-4">
        {portfolios.length === 0 ? (
          <Card className="bg-slate-50 border-dashed border-slate-300">
            <CardContent className="p-12 text-center">
              <p className="text-slate-600 mb-4">Noch kein Portfolio vorhanden</p>
              <Button onClick={() => setShowForm(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Erstes Portfolio erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          portfolios.map(portfolio => (
            <Link key={portfolio.id} to={createPageUrl('PortfolioDetail') + `?id=${portfolio.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{portfolio.name}</CardTitle>
                      {portfolio.description && (
                        <p className="text-sm text-slate-600 mt-1">{portfolio.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR',
                          maximumFractionDigits: 0
                        }).format(getPortfolioValue(portfolio.id))}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {portfolio.tax_jurisdiction} • {portfolio.is_taxable ? 'Steuerpflichtig' : 'Steuerfrei'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                        Konten: TBD
                      </span>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                        Positionen: TBD
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPortfolio ? 'Portfolio bearbeiten' : 'Neues Portfolio'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Portfolio-Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Hauptdepot"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Beschreibung
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Steuerland
              </label>
              <select
                value={formData.tax_jurisdiction}
                onChange={(e) => setFormData({ ...formData, tax_jurisdiction: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Speichern
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}