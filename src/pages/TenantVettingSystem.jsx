import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function TenantVettingSystem() {
  const { data: reports = [] } = useQuery({
    queryKey: ['vetting-reports'],
    queryFn: () => base44.entities.TenantVettingReport.list('-created_date', 100)
  });

  const getRiskColor = (level) => {
    if (level === 'low') return 'bg-green-100 text-green-800';
    if (level === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRecommendationIcon = (rec) => {
    if (rec === 'approve') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (rec === 'reject') return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mietervetting & Risikoanalyse</h1>
        <p className="text-slate-600 mt-1">KI-basierte Bonitätsprüfung & Risikobewertung</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{reports.length}</div>
            <p className="text-sm text-slate-600">Berichte</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">
              {reports.filter(r => r.recommendation === 'approve').length}
            </div>
            <p className="text-sm text-slate-600">Empfohlen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600">
              {reports.filter(r => r.recommendation === 'conditional').length}
            </div>
            <p className="text-sm text-slate-600">Konditional</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">
              {reports.filter(r => r.recommendation === 'reject').length}
            </div>
            <p className="text-sm text-slate-600">Abgelehnt</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <Card key={report.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getRecommendationIcon(report.recommendation)}
                    <span className="font-medium">Tenant {report.tenant_id}</span>
                    <Badge className={getRiskColor(report.risk_level)}>
                      {report.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Credit Score</p>
                      <p className="font-bold">{report.credit_score || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Risikoscore</p>
                      <p className="font-bold">{report.risk_score}/100</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Ausfallwahrscheinlichkeit</p>
                      <p className="font-bold">{report.default_probability}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}