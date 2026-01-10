import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import DocumentClassificationRuleBuilder from '@/components/documents/DocumentClassificationRuleBuilder';
import DocumentRetentionPolicyManager from '@/components/documents/DocumentRetentionPolicyManager';
import VisualTemplateBuilder from '@/components/documents/VisualTemplateBuilder';

export default function DocumentComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('classification');
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: building } = useQuery({
    queryKey: ['building', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const buildings = await base44.asServiceRole.entities.Building.filter({
        created_by: user.email
      }, '-created_date', 1);
      return buildings[0];
    },
    enabled: !!user?.email
  });

  const companyId = building?.company_id || user?.company_id;

  const { data: classificationRules = [] } = useQuery({
    queryKey: ['classification-rules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const result = await base44.asServiceRole.entities.DocumentClassificationRule.filter({
        company_id: companyId
      });
      return result;
    },
    enabled: !!companyId
  });

  const { data: retentionPolicies = [] } = useQuery({
    queryKey: ['retention-policies', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const result = await base44.asServiceRole.entities.DocumentRetentionPolicy.filter({
        company_id: companyId
      });
      return result;
    },
    enabled: !!companyId
  });

  const reportMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('generateComplianceReport', {
        company_id: companyId,
        report_type: 'gdpr_compliance',
        period_start: reportStartDate,
        period_end: reportEndDate
      })
  });

  const retentionMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('processDocumentRetention', {
        company_id: companyId
      })
  });

  if (!companyId) {
    return <div className="text-center py-12">Lade Daten...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dokumenten Compliance & Verwaltung</h1>
        <p className="text-slate-600 mt-1">
          Klassifizierung, Aufbewahrung, Compliance & Templates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'classification', label: 'Klassifizierung' },
          { id: 'retention', label: 'Aufbewahrung' },
          { id: 'templates', label: 'Templates' },
          { id: 'compliance', label: 'Compliance' }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className="rounded-none border-b-2"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'classification' && (
        <div className="space-y-4">
          <DocumentClassificationRuleBuilder companyId={companyId} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aktive Regeln ({classificationRules.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {classificationRules.map(rule => (
                  <div key={rule.id} className="p-2 border rounded">
                    <p className="font-medium text-sm">{rule.name}</p>
                    <p className="text-xs text-slate-600">{rule.document_type}</p>
                    {rule.keywords && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rule.keywords.slice(0, 3).map(kw => (
                          <Badge key={kw} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'retention' && (
        <DocumentRetentionPolicyManager companyId={companyId} />
      )}

      {activeTab === 'templates' && (
        <VisualTemplateBuilder companyId={companyId} />
      )}

      {activeTab === 'compliance' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GDPR Compliance Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="date"
                value={reportStartDate}
                onChange={(e) => setReportStartDate(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
              <input
                type="date"
                value={reportEndDate}
                onChange={(e) => setReportEndDate(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                className="gap-2"
              >
                {reportMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Report generieren
              </Button>
              <Button
                onClick={() => retentionMutation.mutate()}
                disabled={retentionMutation.isPending}
                variant="outline"
                className="gap-2"
              >
                {retentionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Aufbewahrung verarbeiten
              </Button>
            </div>

            {retentionPolicies.length > 0 && (
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-2">Aktive Richtlinien:</p>
                  <div className="space-y-1">
                    {retentionPolicies.map(p => (
                      <p key={p.id} className="text-xs text-slate-700">
                        {p.name} - {p.retention_days} Tage ({p.action_after_retention})
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}