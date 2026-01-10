import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MessageCircle, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function CommunicationAnalytics() {
  const { data: threads = [] } = useQuery({
    queryKey: ['analytics-threads-detailed'],
    queryFn: () => base44.entities.MessageThread.list('-created_date', 1000)
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['analytics-messages-detailed'],
    queryFn: () => base44.entities.TenantMessage.list('-created_date', 5000)
  });

  // Response time analysis per category
  const responseTimesByCategory = Object.entries(
    threads.reduce((acc, thread) => {
      if (thread.status !== 'resolved') return acc;
      
      const category = thread.category || 'general';
      const created = new Date(thread.created_date);
      const resolved = new Date(thread.last_message_at);
      const hoursToResolve = (resolved - created) / (1000 * 60 * 60);
      
      if (!acc[category]) acc[category] = { total: 0, count: 0 };
      acc[category].total += hoursToResolve;
      acc[category].count += 1;
      
      return acc;
    }, {})
  ).map(([category, data]) => ({
    category,
    avgHours: (data.total / data.count).toFixed(1)
  }));

  // Messages per day (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const messagesPerDay = last30Days.map(date => ({
    date: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    incoming: messages.filter(m => m.created_date.startsWith(date) && m.direction === 'from_tenant').length,
    outgoing: messages.filter(m => m.created_date.startsWith(date) && m.direction === 'to_tenant').length
  }));

  // Category distribution with counts
  const categoryStats = Object.entries(
    threads.reduce((acc, t) => {
      const cat = t.category || 'general';
      if (!acc[cat]) acc[cat] = { total: 0, open: 0, resolved: 0 };
      acc[cat].total += 1;
      if (t.status === 'open') acc[cat].open += 1;
      if (t.status === 'resolved') acc[cat].resolved += 1;
      return acc;
    }, {})
  ).map(([category, stats]) => ({ category, ...stats }));

  const totalMessages = messages.length;
  const totalThreads = threads.length;
  const openThreads = threads.filter(t => t.status === 'open').length;
  const avgMessagesPerThread = (totalMessages / Math.max(totalThreads, 1)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <MessageCircle className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{totalThreads}</p>
            <p className="text-sm text-slate-600">Gesamt Konversationen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-2xl font-bold">{openThreads}</p>
            <p className="text-sm text-slate-600">Offene Threads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{totalMessages}</p>
            <p className="text-sm text-slate-600">Gesamt Nachrichten</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Clock className="w-6 h-6 text-orange-600 mb-2" />
            <p className="text-2xl font-bold">{avgMessagesPerThread}</p>
            <p className="text-sm text-slate-600">Ø Nachrichten/Thread</p>
          </CardContent>
        </Card>
      </div>

      {/* Message Volume Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nachrichten-Volumen (30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messagesPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="incoming" fill="#3b82f6" name="Eingehend" />
              <Bar dataKey="outgoing" fill="#10b981" name="Ausgehend" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Time by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Durchschnittliche Antwortzeit nach Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimesByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 12 }} label={{ value: 'Stunden', position: 'insideBottom', offset: -5 }} />
              <YAxis type="category" dataKey="category" stroke="#64748b" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="avgHours" fill="#f59e0b" name="Ø Stunden" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategorie-Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 text-left font-semibold">Kategorie</th>
                  <th className="p-3 text-right font-semibold">Gesamt</th>
                  <th className="p-3 text-right font-semibold">Offen</th>
                  <th className="p-3 text-right font-semibold">Gelöst</th>
                  <th className="p-3 text-right font-semibold">Lösungsrate</th>
                </tr>
              </thead>
              <tbody>
                {categoryStats.map((cat, idx) => (
                  <tr key={idx} className="border-b hover:bg-slate-50">
                    <td className="p-3 capitalize">{cat.category}</td>
                    <td className="p-3 text-right font-semibold">{cat.total}</td>
                    <td className="p-3 text-right text-orange-600">{cat.open}</td>
                    <td className="p-3 text-right text-green-600">{cat.resolved}</td>
                    <td className="p-3 text-right">
                      {((cat.resolved / cat.total) * 100).toFixed(0)}%
                    </td>
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