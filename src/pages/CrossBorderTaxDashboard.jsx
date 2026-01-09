import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Globe, DollarSign } from 'lucide-react';

export default function CrossBorderTaxDashboard() {
  const [taxYear] = useState(new Date().getFullYear() - 1);

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const items = await base44.entities.TaxProfile.list();
      return items[0];
    }
  });

  const { data: calculations } = useQuery({
    queryKey: ['crossBorderCalcs', taxYear],
    queryFn: async () => {
      const items = await base44.entities.TaxCalculation.filter({ tax_year: taxYear });
      return items;
    }
  });

  const { data: transactions } = useQuery({
    queryKey: ['crossBorderTransactions', taxYear],
    queryFn: async () => {
      const items = await base44.entities.CrossBorderTransaction.filter({ tax_year: taxYear });
      return items;
    }
  });

  // Prepare chart data: Tax per country
  const taxPerCountry = profile?.tax_jurisdictions?.map(country => {
    const calc = calculations?.find(c => c.country === country);
    return {
      country,
      tax: calc?.total_tax || 0,
      flag: country === 'AT' ? '🇦🇹' : country === 'CH' ? '🇨🇭' : '🇩🇪'
    };
  }) || [];

  // Transaction breakdown by type
  const transactionTypes = [
    { name: 'Income', value: transactions?.filter(t => t.transaction_type === 'income').length || 0 },
    { name: 'Investment', value: transactions?.filter(t => t.transaction_type === 'investment').length || 0 },
    { name: 'Transfer', value: transactions?.filter(t => t.transaction_type === 'transfer').length || 0 },
    { name: 'Loan', value: transactions?.filter(t => t.transaction_type === 'loan').length || 0 }
  ];

  const COLORS = ['#64748b', '#475569', '#334155', '#1e293b'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Cross-Border Tax Dashboard</h1>
        <p className="text-slate-500 font-light mt-2">Steuerlast pro Land & Grenzüberschreitende Transaktionen ({taxYear})</p>
      </div>

      {/* Critical Alerts */}
      {transactions?.filter(t => t.taxable_event && !t.withholding_tax_applied).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-light text-red-900">
                <strong>{transactions?.filter(t => t.taxable_event && !t.withholding_tax_applied).length}</strong> Transaktionen ohne Withholding Tax dokumentiert
              </p>
              <p className="text-xs font-light text-red-800 mt-1">Action Required: Withholding Tax Dokumentation</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="breakdown">Aufschlüsselung</TabsTrigger>
          <TabsTrigger value="transactions">Transaktionen</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-slate-600">
                  <Globe className="w-4 h-4" />
                  Länder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-light">{profile?.tax_jurisdictions?.length || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-slate-600">
                  <DollarSign className="w-4 h-4" />
                  Gesamtsteuer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-light">€{calculations?.reduce((sum, c) => sum + (c.total_tax || 0), 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-slate-600">
                  <TrendingUp className="w-4 h-4" />
                  Transaktionen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-light">{transactions?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tax per Country Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Steuerlast pro Land</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={taxPerCountry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                  <Bar dataKey="tax" fill="#64748b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transaction Typen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={transactionTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {transactionTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Meldepflichten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs font-light">
                  <span>CRS</span>
                  <span className="font-medium">{transactions?.filter(t => t.reporting_required?.includes('CRS')).length || 0}</span>
                </div>
                <div className="flex justify-between text-xs font-light">
                  <span>FATCA</span>
                  <span className="font-medium">{transactions?.filter(t => t.reporting_required?.includes('FATCA')).length || 0}</span>
                </div>
                <div className="flex justify-between text-xs font-light">
                  <span>AEoI</span>
                  <span className="font-medium">{transactions?.filter(t => t.reporting_required?.includes('AEoI')).length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Grenzüberschreitende Transaktionen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions?.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg text-xs font-light">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{t.transaction_type.toUpperCase()}</span>
                      <span>€{t.amount?.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <span>{t.source_country} → {t.destination_country}</span>
                      <span>{t.transaction_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}