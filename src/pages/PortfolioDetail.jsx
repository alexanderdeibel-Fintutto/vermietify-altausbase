import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function PortfolioDetail() {
  const [searchParams] = useSearchParams();
  const portfolioId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => portfolioId ? base44.entities.Portfolio.read(portfolioId) : null,
    enabled: !!portfolioId
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['portfolio-accounts', portfolioId],
    queryFn: () => base44.entities.PortfolioAccount.filter({ portfolio_id: portfolioId }),
    enabled: !!portfolioId
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings', portfolioId],
    queryFn: () => base44.entities.AssetHolding.list(), // TODO: Filter by portfolio
    enabled: !!portfolioId
  });

  if (!portfolioId) {
    return <div className="text-center py-8">Portfolio nicht gefunden</div>;
  }

  if (portfolioLoading) {
    return <div className="text-center py-8">Lädt...</div>;
  }

  if (!portfolio) {
    return <div className="text-center py-8">Portfolio nicht vorhanden</div>;
  }

  const portfolioValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('PortfolioManagement')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">{portfolio.name}</h1>
          {portfolio.description && (
            <p className="text-slate-600 mt-1">{portfolio.description}</p>
          )}
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Vermögen</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0
              }).format(portfolioValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Konten</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{accounts.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Positionen</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{holdings.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('holdings')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'holdings'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Bestände
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'accounts'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Konten
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Transaktionen
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <Card>
            <CardHeader>
              <CardTitle>Allokation & Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Kurs-Chart und Allokation werden implementiert...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'holdings' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Bestände</h3>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Position hinzufügen
              </Button>
            </div>
            {holdings.length === 0 ? (
              <Card className="bg-slate-50">
                <CardContent className="p-8 text-center text-slate-600">
                  Noch keine Positionen vorhanden
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left px-6 py-3 font-semibold text-slate-900">Asset</th>
                          <th className="text-right px-6 py-3 font-semibold text-slate-900">Menge</th>
                          <th className="text-right px-6 py-3 font-semibold text-slate-900">Wert</th>
                          <th className="text-right px-6 py-3 font-semibold text-slate-900">G/V</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((holding) => (
                          <tr key={holding.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-6 py-3">
                              <div className="font-medium text-slate-900">Asset {holding.id}</div>
                            </td>
                            <td className="text-right px-6 py-3 text-slate-600">{holding.quantity}</td>
                            <td className="text-right px-6 py-3 font-medium">
                              {new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: 'EUR'
                              }).format(holding.current_value || 0)}
                            </td>
                            <td className={`text-right px-6 py-3 font-medium ${
                              (holding.unrealized_gain_loss || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: 'EUR',
                                signDisplay: 'always'
                              }).format(holding.unrealized_gain_loss || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Konten</h3>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Konto hinzufügen
              </Button>
            </div>
            {accounts.length === 0 ? (
              <Card className="bg-slate-50">
                <CardContent className="p-8 text-center text-slate-600">
                  Noch keine Konten vorhanden
                </CardContent>
              </Card>
            ) : (
              accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <CardTitle>{account.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Institution</p>
                        <p className="font-medium text-slate-900">{account.institution_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Kontotyp</p>
                        <p className="font-medium text-slate-900">{account.account_type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card>
            <CardHeader>
              <CardTitle>Transaktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Transaktionsverlauf wird implementiert...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}