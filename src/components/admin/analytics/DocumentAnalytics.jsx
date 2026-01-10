import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, Upload, TrendingUp, HardDrive } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DocumentAnalytics() {
  const { data: documents = [] } = useQuery({
    queryKey: ['analytics-documents-detailed'],
    queryFn: () => base44.entities.Document.filter({ is_uploaded: true }, '-created_date', 1000)
  });

  // Documents by category
  const documentsByCategory = Object.entries(
    documents.reduce((acc, d) => {
      const cat = d.category || 'Sonstiges';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count }));

  // Upload volume over time (last 60 days)
  const last60Days = Array.from({ length: 60 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (59 - i));
    return date.toISOString().split('T')[0];
  });

  const uploadsOverTime = last60Days.map(date => ({
    date: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    count: documents.filter(d => d.created_date.startsWith(date)).length,
    size: documents
      .filter(d => d.created_date.startsWith(date))
      .reduce((sum, d) => sum + (d.file_size || 0), 0) / (1024 * 1024) // MB
  }));

  // File type distribution
  const fileTypeDistribution = Object.entries(
    documents.reduce((acc, d) => {
      const type = d.file_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));

  // Documents by tenant (top 10)
  const documentsByTenant = Object.entries(
    documents.reduce((acc, d) => {
      if (!d.tenant_id) return acc;
      acc[d.tenant_id] = (acc[d.tenant_id] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tenantId, count]) => ({ tenantId, count }));

  // Calculate statistics
  const totalDocuments = documents.length;
  const totalSize = documents.reduce((sum, d) => sum + (d.file_size || 0), 0) / (1024 * 1024); // MB
  const avgDocumentsPerDay = (documents.length / 60).toFixed(1);
  const avgFileSize = (totalSize / Math.max(documents.length, 1)).toFixed(2);

  // Most active upload days
  const uploadsByDay = Object.entries(
    documents.reduce((acc, d) => {
      const day = new Date(d.created_date).toLocaleDateString('de-DE', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {})
  ).map(([day, count]) => ({ day, count }));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <FileText className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{totalDocuments}</p>
            <p className="text-sm text-slate-600">Gesamt Dokumente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <HardDrive className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{totalSize.toFixed(0)} MB</p>
            <p className="text-sm text-slate-600">Speicherplatz</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Upload className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{avgDocumentsPerDay}</p>
            <p className="text-sm text-slate-600">Ø Uploads/Tag</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{avgFileSize} MB</p>
            <p className="text-sm text-slate-600">Ø Dateigröße</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Volume Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload-Volumen (60 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={uploadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke="#8b5cf6" name="Anzahl" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="size" stroke="#3b82f6" name="Größe (MB)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beliebteste Kategorien</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category} (${count})`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {documentsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* File Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dateitypen</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fileTypeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upload Activity by Day of Week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload-Aktivität nach Wochentag</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={uploadsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Uploaders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Mieter (nach Uploads)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold">Rang</th>
                  <th className="p-3 text-left font-semibold">Mieter ID</th>
                  <th className="p-3 text-right font-semibold">Uploads</th>
                </tr>
              </thead>
              <tbody>
                {documentsByTenant.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-3">#{idx + 1}</td>
                    <td className="p-3 font-mono text-xs">{item.tenantId.slice(0, 8)}...</td>
                    <td className="p-3 text-right font-semibold">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}