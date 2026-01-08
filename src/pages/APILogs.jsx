import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Code, AlertCircle } from 'lucide-react';

export default function APILogsPage() {
  const logs = [
    { id: 1, endpoint: 'POST /api/buildings', status: 200, responseTime: '145ms', timestamp: '2026-01-08 14:23:45' },
    { id: 2, endpoint: 'GET /api/tenants', status: 200, responseTime: '89ms', timestamp: '2026-01-08 14:22:30' },
    { id: 3, endpoint: 'PUT /api/payments/123', status: 400, responseTime: '234ms', timestamp: '2026-01-08 14:21:15' },
    { id: 4, endpoint: 'DELETE /api/documents/456', status: 204, responseTime: '56ms', timestamp: '2026-01-08 14:20:00' },
    { id: 5, endpoint: 'POST /api/reports/generate', status: 500, responseTime: '2341ms', timestamp: '2026-01-08 14:19:30' },
  ];

  const getStatusColor = (status) => {
    if (status < 300) return 'bg-green-600';
    if (status < 400) return 'bg-blue-600';
    if (status < 500) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📝 API Logs</h1>
        <p className="text-slate-600 mt-1">Überwachung aller API-Aufrufe</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input placeholder="Nach Endpoint suchen..." className="pl-10" />
      </div>

      <div className="space-y-2">
        {logs.map((log) => (
          <Card key={log.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-3">
                  <Code className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{log.endpoint}</p>
                    <p className="text-xs text-slate-600">{log.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">{log.responseTime}</span>
                  <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}