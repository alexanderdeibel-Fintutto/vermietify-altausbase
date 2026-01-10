import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PlausibilityChecker() {
  const { data: checks } = useQuery({
    queryKey: ['plausibilityChecks'],
    queryFn: async () => {
      const response = await base44.functions.invoke('runPlausibilityChecks', {});
      return response.data;
    }
  });

  const fixMutation = useMutation({
    mutationFn: async (issueId) => {
      await base44.functions.invoke('autoFixIssue', { issue_id: issueId });
    },
    onSuccess: () => {
      toast.success('Problem behoben');
    }
  });

  if (!checks) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Plausibilitätsprüfung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.issues.map((issue, idx) => (
          <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{issue.title}</p>
                <p className="text-xs text-slate-600">{issue.description}</p>
                <Button size="sm" className="mt-2" onClick={() => fixMutation.mutate(issue.id)}>
                  Auto-Fix
                </Button>
              </div>
            </div>
          </div>
        ))}
        {checks.issues.length === 0 && (
          <div className="text-center py-4 text-green-600">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">Alle Prüfungen bestanden</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}