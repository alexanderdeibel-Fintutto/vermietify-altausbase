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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportingCharts({ metrics }) {
  return (
    <div className="space-y-6">
      {/* Document & Task Timeline */}
      {metrics?.documents_timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dokumente & Aufgaben über Zeit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.documents_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="documents"
                  stroke="#3b82f6"
                  name="Dokumente"
                  connectNulls
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Task Performance */}
      {metrics?.tasks_timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aufgabenabschlüsse</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.tasks_timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" fill="#3b82f6" name="Erstellt" />
                <Bar dataKey="completed" fill="#10b981" name="Abgeschlossen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Types */}
        {metrics?.documents_by_type && Object.keys(metrics.documents_by_type).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dokumente nach Typ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(metrics.documents_by_type).map(([name, value]) => ({
                      name,
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.keys(metrics.documents_by_type).map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Task Status Distribution */}
        {metrics?.tasks_by_status && Object.keys(metrics.tasks_by_status).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aufgaben nach Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(metrics.tasks_by_status).map(([name, value]) => ({
                      name,
                      value
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.keys(metrics.tasks_by_status).map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Priority Distribution */}
        {metrics?.tasks_by_priority && Object.keys(metrics.tasks_by_priority).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aufgaben nach Priorität</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={Object.entries(metrics.tasks_by_priority).map(([priority, count]) => ({
                    priority,
                    count
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="priority" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Workflow Rules */}
        {metrics?.rules_by_trigger && Object.keys(metrics.rules_by_trigger).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regeln nach Trigger-Typ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={Object.entries(metrics.rules_by_trigger).map(([trigger, count]) => ({
                    trigger,
                    count
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="trigger" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}