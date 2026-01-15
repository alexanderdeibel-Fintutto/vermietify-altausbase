import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantVettingPanel({ applicantId }) {
  const [loading, setLoading] = useState(false);
  const [vetted, setVetted] = useState(false);
  const [vettingResult, setVettingResult] = useState(null);

  const { data: applicant } = useQuery({
    queryKey: ['tenantApplicant', applicantId],
    queryFn: async () => {
      const all = await base44.entities.TenantApplicant.list();
      return all.find(a => a.id === applicantId);
    }
  });

  const handleVetting = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('screenTenantApplicant', {
        applicantId
      });

      setVettingResult(response.data);
      setVetted(true);
      toast.success('Screening durchgeführt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!applicant) return <div className="text-gray-600">Bewerber nicht gefunden</div>;

  const getRecommendationColor = (rec) => {
    if (rec === 'APPROVE') return 'bg-green-50 border-green-200';
    if (rec === 'REVIEW') return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRecommendationIcon = (rec) => {
    if (rec === 'APPROVE') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (rec === 'REVIEW') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bewerberdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{applicant.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{applicant.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Beschäftigung:</span>
            <span className="font-medium">{applicant.employment_status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Monatliches Einkommen:</span>
            <span className="font-medium">€{applicant.monthly_income?.toFixed(0) || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Referenzen:</span>
            <span className="font-medium">{applicant.references?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Führungszeugnis:</span>
            <span className={`font-medium ${applicant.criminal_record ? 'text-red-600' : 'text-green-600'}`}>
              {applicant.criminal_record ? '⚠ Vermerke vorhanden' : '✓ Keine Vermerke'}
            </span>
          </div>
        </CardContent>
      </Card>

      {!vetted ? (
        <Button onClick={handleVetting} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Screening durchführen
        </Button>
      ) : vettingResult ? (
        <Card className={`border-2 ${getRecommendationColor(vettingResult.approval_recommendation)}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getRecommendationIcon(vettingResult.approval_recommendation)}
              {vettingResult.approval_recommendation === 'APPROVE' ? 'Genehmigt' : 
               vettingResult.approval_recommendation === 'REVIEW' ? 'Überprüfung erforderlich' : 
               'Abgelehnt'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Einkommen-Score:</span>
                <span className="font-medium">{vettingResult.scores.income_score.toFixed(1)}/40</span>
              </div>
              <div className="flex justify-between">
                <span>Beschäftigungs-Score:</span>
                <span className="font-medium">{vettingResult.scores.employment_score}/25</span>
              </div>
              <div className="flex justify-between">
                <span>Bonitäts-Score:</span>
                <span className="font-medium">{vettingResult.scores.credit_score}/30</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Gesamt:</span>
                <span>{vettingResult.total_score.toFixed(0)}/100</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
              {vettingResult.vetting_notes}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}