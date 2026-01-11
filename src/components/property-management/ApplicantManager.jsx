import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calculator } from 'lucide-react';

export default function ApplicantManager({ companyId }) {
  const queryClient = useQueryClient();

  const { data: applicants = [] } = useQuery({
    queryKey: ['applicants', companyId],
    queryFn: () => base44.asServiceRole.entities.Applicant.filter({ company_id: companyId })
  });

  const scoreMutation = useMutation({
    mutationFn: (applicantId) =>
      base44.functions.invoke('processApplicant', { applicant_id: applicantId, action: 'calculate_score' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applicants'] })
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Bewerberverwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {applicants.map(app => (
          <div key={app.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {app.first_name} {app.last_name}
              </span>
              {app.credit_score && (
                <Badge className={getScoreColor(app.credit_score)}>
                  Score: {app.credit_score}
                </Badge>
              )}
            </div>

            <div className="text-xs space-y-1 mb-2">
              <p>Einkommen: {app.monthly_income}€</p>
              <p>Status: {app.status}</p>
              <p>SCHUFA: {app.schufa_status}</p>
            </div>

            {!app.credit_score && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => scoreMutation.mutate(app.id)}
                className="w-full gap-1"
              >
                <Calculator className="w-3 h-3" />
                Bonität prüfen
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}