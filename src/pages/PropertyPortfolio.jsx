import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PropertyPortfolio() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['bank-transactions'],
    queryFn: () => base44.entities.BankTransaction.list()
  });

  // Portfolio-Statistiken
  const portfolioStats = useMemo(() => {
    const totalValue = buildings.reduce((sum, b) => sum + (b.property_value || 0), 0);
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => u.status === 'occupied').length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalValue,
      totalUnits,
      occupancyRate,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses
    };
  }, [buildings, units, transactions]);

  // Building-Details
  const buildingStats = useMemo(() => {
    return buildings.map(building => {
      const buildingUnits = units.filter(u => u.building_id === building.id);
      const occupied = buildingUnits.filter(u => u.status === 'occupied').length;
      const buildingTenants = tenants.filter(t => buildingUnits.some(u => u.id === t.unit_id));

      return {
        ...building,
        unitCount: buildingUnits.length,
        occupiedCount: occupied,
        occupancyRate: buildingUnits.length > 0 ? (occupied / buildingUnits.length) * 100 : 0,
        tenantCount: buildingTenants.length
      };
    });
  }, [buildings, units, tenants]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏢 Immobilien-Portfolio</h1>
        <p className="text-slate-600 mt-1">Übersicht über alle Objekte und Leistungsmetriken</p>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamtportfoliowert</p>
            <p className="text-2xl font-bold">€{(portfolioStats.totalValue / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Einheiten</p>
            <p className="text-2xl font-bold">{portfolioStats.totalUnits}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Auslastung</p>
            <p className="text-2xl font-bold text-green-600">{portfolioStats.occupancyRate.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Jahreseinkommen</p>
            <p className="text-2xl font-bold text-blue-600">€{(portfolioStats.totalIncome / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Nettoeinkommen</p>
            <p className={`text-2xl font-bold ${portfolioStats.netIncome > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              €{(portfolioStats.netIncome / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="buildings">Objekte</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio-Auslastung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={buildingStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="occupiedCount" fill="#10b981" name="Besetzt" />
                  <Bar dataKey="unitCount" fill="#e5e7eb" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buildings" className="space-y-4">
          {buildingStats.map(building => (
            <Card key={building.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedBuilding(building.id)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {building.name}
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{building.address}</p>
                  </div>
                  <Badge variant={building.occupancyRate > 80 ? 'default' : 'secondary'}>
                    {building.occupancyRate.toFixed(0)}% Auslastung
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Einheiten</p>
                  <p className="text-lg font-bold">{building.unitCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Besetzt</p>
                  <p className="text-lg font-bold text-green-600">{building.occupiedCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Mieter</p>
                  <p className="text-lg font-bold">{building.tenantCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Wert</p>
                  <p className="text-lg font-bold">€{(building.property_value / 1000000).toFixed(1)}M</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Einnahmen vs. Ausgaben (12 Monate)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: 'Jan', income: 50000, expenses: 30000 },
                  { month: 'Feb', income: 52000, expenses: 31000 },
                  { month: 'Mar', income: 51000, expenses: 32000 },
                  { month: 'Apr', income: 53000, expenses: 30000 },
                  { month: 'May', income: 54000, expenses: 33000 },
                  { month: 'Jun', income: 55000, expenses: 31000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Einnahmen" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Ausgaben" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}