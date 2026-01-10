import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, TrendingUp, Receipt } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PropertyTaxOverview() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financialItems'],
    queryFn: () => base44.entities.FinancialItem.list('-date', 500)
  });

  const currentYear = new Date().getFullYear();
  const yearItems = financialItems.filter(f => f.date?.startsWith(currentYear.toString()));

  const income = yearItems.filter(f => f.type === 'income').reduce((sum, f) => sum + (f.amount || 0), 0);
  const expenses = yearItems.filter(f => f.type === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0);
  const netIncome = income - expenses;

  const propertyStats = buildings.map(b => {
    const buildingIncome = yearItems.filter(f => f.building_id === b.id && f.type === 'income')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    const buildingExpenses = yearItems.filter(f => f.building_id === b.id && f.type === 'expense')
      .reduce((sum, f) => sum + (f.amount || 0), 0);
    
    return {
      name: b.name?.slice(0, 15) || 'Objekt',
      income: buildingIncome,
      expenses: buildingExpenses,
      net: buildingIncome - buildingExpenses
    };
  }).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Objekte</p>
                <p className="text-3xl font-bold text-blue-600">{buildings.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Einnahmen {currentYear}</p>
                <p className="text-2xl font-bold text-green-600">
                  {income.toLocaleString('de-DE')} €
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
                <p className="text-sm text-slate-600">Ausgaben {currentYear}</p>
                <p className="text-2xl font-bold text-red-600">
                  {expenses.toLocaleString('de-DE')} €
                </p>
              </div>
              <Receipt className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Nettoertrag</p>
                <p className="text-2xl font-bold text-purple-600">
                  {netIncome.toLocaleString('de-DE')} €
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Einnahmen/Ausgaben nach Objekt</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={propertyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="income" fill="#10b981" name="Einnahmen" />
              <Bar dataKey="expenses" fill="#ef4444" name="Ausgaben" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}