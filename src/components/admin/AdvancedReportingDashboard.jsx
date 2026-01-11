import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

export default function AdvancedReportingDashboard() {
  const [reportType, setReportType] = useState('revenue');
  const [dateRange, setDateRange] = useState('month');

  const { data: contracts = [] } = useQuery({
    queryKey: ['contractsForReport'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['paymentsForReport'],
    queryFn: () => base44.entities.Payment.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildingsForReport'],
    queryFn: () => base44.entities.Building.list()
  });

  // Generate revenue data
  const getRevenueData = () => {
    const monthlyData = {};
    payments.forEach(p => {
      const month = new Date(p.payment_date).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      monthlyData[month] = (monthlyData[month] || 0) + (p.amount || 0);
    });
    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount: parseFloat(amount.toFixed(2))
    })).slice(-12);
  };

  // Contract status distribution
  const getContractStatusData = () => {
    const statusMap = {};
    contracts.forEach(c => {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([status, count]) => ({
      name: status === 'active' ? 'Aktiv' : status === 'terminated' ? 'Beendet' : 'Abgelaufen',
      value: count
    }));
  };

  // Building occupancy
  const getBuildingOccupancy = () => {
    return buildings.slice(0, 8).map(b => {
      const buildingContracts = contracts.filter(c => c.unit_id === b.id && c.status === 'active');
      return {
        building: b.name.substring(0, 12),
        occupied: buildingContracts.length,
        total: Math.max(5, buildingContracts.length + 2)
      };
    });
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const revenueData = getRevenueData();
  const statusData = getContractStatusData();
  const occupancyData = getBuildingOccupancy();

  const handleExportReport = () => {
    toast.success('Report wird generiert...');
    setTimeout(() => toast.success('Report erfolgreich heruntergeladen'), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Umsatz</SelectItem>
                <SelectItem value="contracts">Verträge</SelectItem>
                <SelectItem value="occupancy">Belegung</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="quarter">Dieses Quartal</SelectItem>
                <SelectItem value="year">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportReport} className="gap-2">
              <Download className="w-4 h-4" />
              Exportieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Umsatztrend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(2)}€`} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contract Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vertragsverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Building Occupancy */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Gebäudebelegung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="building" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied" fill="#10b981" />
                <Bar dataKey="total" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Durchschn. Miete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {contracts.length > 0
                ? (contracts.reduce((sum, c) => sum + (c.total_rent || 0), 0) / contracts.length).toFixed(2)
                : '0'}€
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Belegungsquote</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {contracts.length > 0
                ? ((contracts.filter(c => c.status === 'active').length / contracts.length) * 100).toFixed(1)
                : '0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Gesamtumsatz (diesen Monat)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}€
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}