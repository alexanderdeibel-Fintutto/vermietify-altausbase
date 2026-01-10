import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DocumentAnalysisWidget() {
  const { data: analyses = [] } = useQuery({
    queryKey: ['pending-document-analyses'],
    queryFn: async () => {
      const all = await base44.entities.DocumentAnalysis.list('-created_date', 50);
      return all.filter(a => a.status === 'pending');
    }
  });

  const highConfidence = analyses.filter(a => a.confidence_score > 0.8);
  const needsReview = analyses.filter(a => a.confidence_score <= 0.8);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumente
          </CardTitle>
          {analyses.length > 0 && (
            <Badge variant="secondary">{analyses.length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 mb-1">Bereit</p>
            <p className="text-2xl font-bold text-green-900">{highConfidence.length}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-600 mb-1">Prüfen</p>
            <p className="text-2xl font-bold text-orange-900">{needsReview.length}</p>
          </div>
        </div>

        {/* Recent */}
        {analyses.slice(0, 3).map((analysis) => (
          <div key={analysis.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {analysis.vendor_name || 'Unbekannt'}
              </p>
              <p className="text-xs text-slate-500">
                {analysis.amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <Badge variant={analysis.confidence_score > 0.8 ? 'default' : 'outline'}>
              {(analysis.confidence_score * 100).toFixed(0)}%
            </Badge>
          </div>
        ))}

        {analyses.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine offenen Dokumente
          </p>
        )}

        {analyses.length > 0 && (
          <Link to={createPageUrl('DocumentAnalysisDashboard')}>
            <p className="text-sm text-blue-600 hover:underline text-center pt-2">
              Alle anzeigen →
            </p>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}