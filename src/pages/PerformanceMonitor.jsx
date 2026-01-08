import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Activity, Zap } from 'lucide-react';

export default function PerformanceMonitorPage() {
  const performanceData = [
    { time: '00:00', cpu: 24, memory: 42, requests: 180 },
    { time: '04:00', cpu: 18, memory: 35, requests: 120 },
    { time: '08:00', cpu: 45, memory: 68, requests: 420 },
    { time: '12:00', cpu: 52, memory: 72, requests: 580 },
    { time: '16:00', cpu: 48, memory: 65, requests: 510 },
    { time: '20:00', cpu: 35, memory: 52, requests: 380 },
  ];

  const metrics = [
    { label: 'CPU Auslastung', value: '52%', status: 'warning' },
    { label: 'Memory Auslastung', value: '72%', status: 'high' },
    { label: 'Anfragen/Sek', value: '145', status: 'good' },
    { label: 'API Latenz', value: '245ms', status: 'good' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📊 Performance Monitor</h1>
        <p className="text-slate-600 mt-1">Echtzeit-Performance des Systems überwachen</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m, idx) => (
          <Card key={idx} className="border border-slate-200">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-600">{m.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
              <div className={`mt-2 h-1 rounded-full ${
                m.status === 'good' ? 'bg-green-600' :
                m.status === 'warning' ? 'bg-orange-600' :
                'bg-red-600'
              }`}></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle>System Auslastung (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#f59e0b" name="CPU" />
              <Line type="monotone" dataKey="memory" stroke="#3b82f6" name="Memory" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-amber-200 bg-amber-50">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">Memory-Auslastung überschreitet 70%. Bitte erwägen Sie eine Optimierung.</p>
        </CardContent>
      </Card>
    </div>
  );
}