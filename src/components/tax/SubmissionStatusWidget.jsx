import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SubmissionStatusWidget() {
  const { data: recentSubmissions, isLoading } = useQuery({
    queryKey: ['recentSubmissions'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const subs = await base44.entities.ElsterSubmission.filter(
        { user_email: user.email },
        '-submission_date',
        5
      );
      return subs;
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Letzte Einreichungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recentSubmissions && recentSubmissions.length > 0 ? (
          <>
            {recentSubmissions.slice(0, 3).map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(sub.status)}
                  <div className="text-sm">
                    <p className="font-medium">{sub.tax_year}</p>
                    <p className="text-xs text-slate-500">{sub.country}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{sub.status}</Badge>
              </div>
            ))}
            <Link to={createPageUrl('SubmissionDashboard')}>
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Alle anzeigen
              </Button>
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">Keine Einreichungen</p>
        )}
      </CardContent>
    </Card>
  );
}