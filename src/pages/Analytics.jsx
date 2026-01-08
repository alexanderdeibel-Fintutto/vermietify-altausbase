import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Building2, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('6months');

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items'],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  // Revenue Analysis
  const getMonthlyRevenue = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const income = financialItems.filter(item => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate >= monthStart && dueDate <= monthEnd && item.type === 'income';
      }).reduce((sum, item) => sum + (item.amount || 0), 0);

      const expenses = financialItems.filter(item => {
        if (!item.due_date) return false;
        const dueDate = new Date(item.due_date);
        return dueDate >= monthStart && dueDate <= monthEnd && item.type === 'expense';
      }).reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);

      months.push({
        month: format(date, 'MMM', { locale: de }),
        Einnahmen: income,
        Ausgaben: expenses,
        Gewinn: income - expenses
      });
    }
    
    return months;
  };

  // Occupancy Analysis
  const occupancyData = [
    { name: 'Vermietet', value: units.filter(u => u.status === 'occupied').length, color: '#10b981' },
    { name: 'Leer', value: units.filter(u => u.status === 'vacant').length, color: '#f59e0b' },
    { name: 'Renovierung', value: units.filter(u => u.status === 'renovation').length, color: '#6366f1' }
  ];

  // Contract Status
  const contractStatusData = [
    { name: 'Aktiv', value: contracts.filter(c => c.status === 'active').length, color: '#10b981' },
    { name: 'Beendet', value: contracts.filter(c => c.status === 'terminated').length, color: '#ef4444' },
    { name: 'Auslaufend', value: contracts.filter(c => c.status === 'expiring').length, color: '#f59e0b' }
  ];

  // Building Performance
  const buildingPerformance = buildings.map(building => {
    const buildingUnits = units.filter(u => u.building_id === building.id);
    const occupiedUnits = buildingUnits.filter(u => u.status === 'occupied').length;
    const totalUnits = buildingUnits.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits * 100) : 0;

    return {
      name: building.name || building.address?.substring(0, 20),
      Auslastung: occupancyRate,
      Einheiten: totalUnits
    };
  }).slice(0, 10);

  // User Activity
  const userActivityData = users.map(user => ({
    name: user.full_name || user.email,
    Aktivität: Math.floor(Math.random() * 100) // Mock data - replace with real activity tracking
  })).slice(0, 10);

  // KPIs
  const totalRevenue = financialItems
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const totalExpenses = financialItems
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

  const occupancyRate = units.length > 0 
    ? (units.filter(u => u.status === 'occupied').length / units.length * 100) 
    : 0;

  const avgRentPerUnit = totalRevenue / (units.filter(u => u.status === 'occupied').length || 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Umfassende Business Intelligence und KPIs</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Letzter Monat</SelectItem>
              <SelectItem value="3months">3 Monate</SelectItem>
              <SelectItem value="6months">6 Monate</SelectItem>
              <SelectItem value="1year">1 Jahr</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamtumsatz</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+12.5%</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Netto-Gewinn</p>
                <p className="text-2xl font-bold text-slate-900">
                  {netProfit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-slate-600">Marge: {profitMargin.toFixed(1)}%</span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Auslastung</p>
                <p className="text-2xl font-bold text-slate-900">{occupancyRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-slate-600">
                    {units.filter(u => u.status === 'occupied').length}/{units.length} Einheiten
                  </span>
                </div>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ø Miete/Einheit</p>
                <p className="text-2xl font-bold text-slate-900">
                  {avgRentPerUnit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-green-600">+5.2%</span>
                </div>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Umsatz & Gewinn</TabsTrigger>
          <TabsTrigger value="occupancy">Auslastung</TabsTrigger>
          <TabsTrigger value="buildings">Objekte</TabsTrigger>
          <TabsTrigger value="users">Nutzer</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Umsatz- und Gewinnentwicklung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={getMonthlyRevenue()}>
                  <defs>
                    <linearGradient id="colorEinnahmen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAusgaben" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                  <Legend />
                  <Area type="monotone" dataKey="Einnahmen" stroke="#10b981" fillOpacity={1} fill="url(#colorEinnahmen)" />
                  <Area type="monotone" dataKey="Ausgaben" stroke="#ef4444" fillOpacity={1} fill="url(#colorAusgaben)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gewinnentwicklung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMonthlyRevenue()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                  <Legend />
                  <Line type="monotone" dataKey="Gewinn" stroke="#6366f1" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Einheiten nach Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={occupancyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {occupancyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verträge nach Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contractStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {contractStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="buildings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objekt-Performance (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={buildingPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Auslastung" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nutzer-Aktivität</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userActivityData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="Aktivität" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}