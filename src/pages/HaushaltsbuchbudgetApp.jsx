import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, PieChart, Calculator, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HaushaltsbuchbudgetApp() {
  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items'],
    queryFn: () => base44.entities.FinancialItem.list('-date', 100)
  });

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthlyItems = financialItems.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
  });

  const income = monthlyItems
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const expenses = monthlyItems
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const balance = income - expenses;

  const features = [
    {
      title: 'Einnahmen',
      icon: TrendingUp,
      value: `€${income.toFixed(2)}`,
      path: 'FinancialItems',
      color: 'bg-green-600'
    },
    {
      title: 'Ausgaben',
      icon: TrendingDown,
      value: `€${expenses.toFixed(2)}`,
      path: 'FinancialItems',
      color: 'bg-red-600'
    },
    {
      title: 'Budget planen',
      icon: Calculator,
      description: 'Monatliche Budgets erstellen',
      path: 'BudgetPlanning',
      color: 'bg-blue-600'
    },
    {
      title: 'Kategorien',
      icon: PieChart,
      description: 'Ausgaben analysieren',
      path: 'FinancialItems',
      color: 'bg-purple-600'
    },
    {
      title: 'Belege',
      icon: Receipt,
      description: 'Dokumente verwalten',
      path: 'Documents',
      color: 'bg-orange-600'
    },
    {
      title: 'Konten',
      icon: Wallet,
      description: 'Bankkonten verbinden',
      path: 'BankAccounts',
      color: 'bg-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Wallet className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Haushaltsbuch & Budget</h1>
          <p className="text-slate-600">Behalten Sie Ihre Finanzen im Blick</p>
        </div>

        <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <CardHeader>
            <CardTitle className="text-white text-lg">Monatsbilanz {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm opacity-90">Einnahmen</p>
                <p className="text-2xl font-bold">€{income.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Ausgaben</p>
                <p className="text-2xl font-bold">€{expenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Saldo</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  €{balance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={createPageUrl(feature.path)}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 ${feature.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-1">{feature.title}</h3>
                  {feature.value && <p className="text-2xl font-bold text-slate-900 mb-1">{feature.value}</p>}
                  {feature.description && <p className="text-sm text-slate-600">{feature.description}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Transaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyItems.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Noch keine Transaktionen diesen Monat</p>
            ) : (
              <div className="space-y-2">
                {monthlyItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.description || 'Keine Beschreibung'}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(item.date).toLocaleDateString('de-DE')} • {item.category || 'Unkategorisiert'}
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : '-'}€{Math.abs(item.amount || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}