import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportChartDisplay({ reportData }) {
  if (!reportData || !reportData.data) {
    return null;
  }

  const renderChart = (chartType, data, title) => {
    if (!data || data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-center py-8">Keine Daten verfügbar</p>
          </CardContent>
        </Card>
      );
    }

    let chart = null;

    if (chartType === 'line') {
      chart = (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {reportData.metrics?.map((metric, idx) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={chartColors[idx % chartColors.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'bar') {
      chart = (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {reportData.metrics?.map((metric, idx) => (
              <Bar
                key={metric}
                dataKey={metric}
                fill={chartColors[idx % chartColors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'pie' && reportData.metrics?.length === 1) {
      chart = (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey={reportData.metrics[0]}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>{chart}</CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {reportData.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(reportData.summary).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600">{key}</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Line Chart - Trends */}
      {reportData.chartType !== 'pie' && renderChart('line', reportData.data, 'Entwicklung über Zeit')}

      {/* Bar Chart - Comparison */}
      {reportData.data && renderChart('bar', reportData.data, 'Vergleichswerte')}

      {/* Pie Chart - Distribution */}
      {reportData.chartType === 'pie' && reportData.data && renderChart('pie', reportData.data, 'Verteilung')}

      {/* Detailed Table */}
      {reportData.detailedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detaillierte Daten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {Object.keys(reportData.detailedData[0] || {}).map(key => (
                      <th key={key} className="text-left py-2 px-4 font-semibold text-slate-700">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.detailedData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      {Object.values(row).map((value, cellIdx) => (
                        <td key={cellIdx} className="py-2 px-4">
                          {typeof value === 'number' ? value.toLocaleString('de-DE') : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}