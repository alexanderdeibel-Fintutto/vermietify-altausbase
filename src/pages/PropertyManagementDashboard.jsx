import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function PropertyManagementDashboard() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.ActualPayment.list()
  });

  const { data: maintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.list()
  });

  // Statistics berechnen
  const stats = {
    total_buildings: buildings.length,
    total_units: units.length,
    occupied_units: leases.filter(l => new Date(l.end_date || new Date(9999, 0, 1)) > new Date()).length,
    total_revenue: payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0),
    pending_payments: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
    open_maintenance: maintenance.filter(m => !['COMPLETED', 'CLOSED'].includes(m.status)).length
  };

  const occupancy_rate = stats.total_units > 0 ? (stats.occupied_units / stats.total_units * 100).toFixed(1) : 0;

  // Revenue Trend Data (letzte 12 Monate)
  const revenueTrendData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    const monthStr = month.toLocaleString('de-DE', { month: 'short' });
    const monthPayments = payments.filter(p => {
      const pDate = new Date(p.payment_date);
      return pDate.getMonth() === month.getMonth() && pDate.getFullYear() === month.getFullYear();
    }).reduce((sum, p) => sum + p.amount, 0);
    return { month: monthStr, revenue: monthPayments };
  });

  const occupancyData = [
    { name: 'Belegt', value: stats.occupied_units, fill: '#10b981' },
    { name: 'Frei', value: stats.total_units - stats.occupied_units, fill: '#e5e7eb' }
  ];

  const maintenanceByCategory = maintenance.reduce((acc, req) => {
    const existing = acc.find(item => item.category === req.category);
    if (existing) existing.count++;
    else acc.push({ category: req.category, count: 1 });
    return acc;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Immobilien-Dashboard</h1>
          <p className="text-slate-600 mt-2">Übersicht aller Eigenschaften und Mieteinahmen</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Gebäude</p>
                  <p className="text-2xl font-bold">{stats.total_buildings}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Einheiten</p>
                  <p className="text-2xl font-bold">{stats.total_units}</p>
                </div>
                <Building2 className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Belegt</p>
                  <p className="text-2xl font-bold">{occupancy_rate}%</p>
                </div>
                <Users className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Eingezahlt</p>
                  <p className="text-2xl font-bold">€{(stats.total_revenue / 1000).toFixed(0)}k</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Ausstehend</p>
                  <p className="text-2xl font-bold text-red-600">€{(stats.pending_payments / 1000).toFixed(0)}k</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">Wartung offen</p>
                  <p className="text-2xl font-bold">{stats.open_maintenance}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mieteinnahmen (12 Monate)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Occupancy Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Belegungsquote</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Building List */}
        <Card>
          <CardHeader>
            <CardTitle>Meine Gebäude</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buildings.map(building => {
                const buildingUnits = units.filter(u => u.building_id === building.id);
                const buildingLeases = leases.filter(l => buildingUnits.some(u => u.id === l.unit_id) && new Date(l.end_date || new Date(9999, 0, 1)) > new Date());
                const buildingRevenue = payments.filter(p => buildingLeases.some(l => l.id === p.lease_contract_id) && p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);

                return (
                  <div
                    key={building.id}
                    onClick={() => setSelectedBuilding(building.id)}
                    className="p-4 border rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-sm">{building.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{building.street_address}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-gray-600">Einheiten</p>
                        <p className="font-bold">{buildingUnits.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Belegt</p>
                        <p className="font-bold">{buildingLeases.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Einnahmen</p>
                        <p className="font-bold">€{(buildingRevenue / 1000).toFixed(0)}k</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}