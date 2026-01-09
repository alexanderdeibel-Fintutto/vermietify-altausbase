import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function TaxAuthoritySubmissions() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['taxSubmissions'],
    queryFn: async () => {
      const result = await base44.entities.ElsterSubmission.list('-updated_date', 50);
      return result;
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'accepted':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-light mb-8">Steuerliche Einreichungen</h1>

      <div className="grid gap-4">
        {submissions && submissions.length > 0 ? (
          submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {submission.country === 'AT' ? 'FINANZOnline Österreich' : `Kanton ${submission.canton}`}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      Steuerjahr {submission.tax_year}
                    </p>
                  </div>
                  <Badge className={getStatusColor(submission.status)}>
                    {submission.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(submission.status)}
                  <div>
                    <p className="text-sm font-medium">Eingereicht: {new Date(submission.submission_date).toLocaleDateString('de-DE')}</p>
                    <p className="text-xs text-slate-500">Referenz: {submission.submission_id}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Status prüfen</Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              Noch keine Einreichungen
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}