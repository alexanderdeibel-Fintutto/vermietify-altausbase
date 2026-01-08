import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ElsterDashboardWidget() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions-widget'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 10)
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ['elster-certificates-widget'],
    queryFn: () => base44.entities.ElsterCertificate.filter({ is_active: true })
  });

  const stats = {
    total: submissions.length,
    draft: submissions.filter(s => s.status === 'DRAFT').length,
    accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
    validCerts: certificates.filter(c => new Date(c.valid_until) > new Date()).length
  };

  const recentSubmissions = submissions.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">ELSTER Status</CardTitle>
          <Link to={createPageUrl('ElsterIntegration')}>
            <Button variant="ghost" size="sm">
              Öffnen →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-slate-50 rounded text-center">
              <div className="text-2xl font-bold text-slate-900">{stats.accepted}</div>
              <div className="text-xs text-slate-600">Akzeptiert</div>
            </div>
            <div className="p-2 bg-orange-50 rounded text-center">
              <div className="text-2xl font-bold text-orange-900">{stats.draft}</div>
              <div className="text-xs text-orange-600">Entwürfe</div>
            </div>
          </div>

          {/* Certificate Warning */}
          {stats.validCerts === 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-700">Kein gültiges Zertifikat</span>
            </div>
          )}

          {/* Recent Submissions */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">Letzte Submissions</div>
            <div className="space-y-2">
              {recentSubmissions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">Keine Submissions</p>
              ) : (
                recentSubmissions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between text-xs p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span className="font-medium">{sub.tax_form_type}</span>
                      <span className="text-slate-500">{sub.tax_year}</span>
                    </div>
                    <Badge 
                      variant={sub.status === 'ACCEPTED' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {sub.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}