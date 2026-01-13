import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';

export default function ElsterAutomationHub() {
  const queryClient = useQueryClient();

  const { data: audits = [] } = useQuery({
    queryKey: ['elster-audits'],
    queryFn: () => base44.entities.ElsterComplianceAudit.list('-created_date', 50)
  });

  const submitMutation = useMutation({
    mutationFn: async (auditId) => {
      return await base44.entities.ElsterComplianceAudit.update(auditId, { 
        submission_status: 'submitted',
        submission_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elster-audits'] });
    }
  });

  const pendingAudits = audits.filter(a => a.submission_status === 'pending');
  const acceptedCount = audits.filter(a => a.submission_status === 'accepted').length;
  const avgComplianceScore = (audits.reduce((sum, a) => sum + a.compliance_score, 0) / audits.length || 0).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Elster Automation</h1>
          <p className="text-slate-600">Automatische Steuererklärung & Compliance-Audit</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{pendingAudits.length}</div>
            <p className="text-sm text-slate-600">Ausstehend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{acceptedCount}</div>
            <p className="text-sm text-slate-600">Akzeptiert</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{avgComplianceScore}%</div>
            <p className="text-sm text-slate-600">Compliance-Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">
              {audits.reduce((sum, a) => sum + a.auto_corrected, 0)}
            </div>
            <p className="text-sm text-slate-600">Auto-korrigiert</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {audits.map(audit => (
          <Card key={audit.id}>
            <CardContent className="p-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {audit.submission_status === 'accepted' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {audit.issues_found > 0 && (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <p className="font-medium">
                      {audit.user_email.split('@')[0]} ({audit.tax_year})
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Compliance</p>
                      <p className="font-bold">{audit.compliance_score}%</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Probleme</p>
                      <p className="font-bold">{audit.issues_found} (↔ {audit.auto_corrected})</p>
                    </div>
                    <div>
                      <Badge className={
                        audit.submission_status === 'accepted' ? 'bg-green-100 text-green-800' :
                        audit.submission_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {audit.submission_status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {audit.submission_status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => submitMutation.mutate(audit.id)}
                    disabled={audit.issues_found > 0}
                  >
                    Einreichen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}