import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText, Signature, Layers } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, trend, color = 'blue' }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`w-4 h-4 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? '+' : ''}{trend}% vs. letzte Periode
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function DocumentMetricsCards({ analytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={FileText}
        label="Dokumente erstellt"
        value={analytics?.metrics?.documents_created || 0}
        color="blue"
      />
      <MetricCard
        icon={Signature}
        label="Signaturanfragen"
        value={analytics?.signatureStats?.total || 0}
        color="purple"
      />
      <MetricCard
        icon={Layers}
        label="Templates genutzt"
        value={analytics?.metrics?.templates_used || 0}
        color="green"
      />
      <MetricCard
        icon={TrendingUp}
        label="Batch Uploads"
        value={analytics?.metrics?.batch_uploads || 0}
        color="orange"
      />
    </div>
  );
}