import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  RefreshCw,
  FileText 
} from 'lucide-react';
import { toast } from 'sonner';

export default function SubmissionDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      const result = await base44.entities.ElsterSubmission.filter(
        { user_email: (await base44.auth.me()).email },
        '-submission_date',
        100
      );
      return result;
    }
  });

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      await refetch();
      toast.success('Status aktualisiert');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const groupByCountry = (subs) => {
    return subs.reduce((acc, sub) => {
      if (!acc[sub.country]) acc[sub.country] = [];
      acc[sub.country].push(sub);
      return acc;
    }, {});
  };

  const stats = submissions ? {
    total: submissions.length,
    accepted: submissions.filter(s => s.status === 'accepted').length,
    pending: submissions.filter(s => ['submitted', 'processing'].includes(s.status)).length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  } : { total: 0, accepted: 0, pending: 0, rejected: 0 };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const grouped = submissions ? groupByCountry(submissions) : {};

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-light">Einreichungsübersicht</h1>
        <Button onClick={handleRefreshStatus} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Gesamt</p>
            <p className="text-2xl font-light mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">Akzeptiert</p>
            <p className="text-2xl font-light mt-1 text-green-600">{stats.accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-blue-600">Ausstehend</p>
            <p className="text-2xl font-light mt-1 text-blue-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">Abgelehnt</p>
            <p className="text-2xl font-light mt-1 text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions by Country */}
      <Tabs defaultValue="AT" className="w-full">
        <TabsList>
          {Object.keys(grouped).map(country => (
            <TabsTrigger key={country} value={country}>
              {country === 'AT' ? 'Österreich' : country === 'CH' ? 'Schweiz' : country}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(grouped).map(([country, subs]) => (
          <TabsContent key={country} value={country} className="space-y-4">
            {subs.length === 0 ? (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>Keine Einreichungen für dieses Land</AlertDescription>
              </Alert>
            ) : (
              subs.map(sub => (
                <Card key={sub.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(sub.status)}
                        <div>
                          <CardTitle className="text-base">
                            {sub.form_type === 'EINKST' ? 'Einkommensteuererklärung' : sub.form_type}
                          </CardTitle>
                          <p className="text-sm text-slate-500">
                            Steuerjahr {sub.tax_year} • {sub.country === 'AT' ? 'FINANZOnline' : `Kanton ${sub.canton}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(sub.status)}>
                        {sub.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Eingereicht</p>
                        <p className="font-medium">{new Date(sub.submission_date).toLocaleDateString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Referenz</p>
                        <p className="font-mono text-xs">{sub.submission_id}</p>
                      </div>
                      {sub.expected_completion_date && (
                        <div>
                          <p className="text-slate-500">Erwartet</p>
                          <p className="font-medium">{new Date(sub.expected_completion_date).toLocaleDateString('de-DE')}</p>
                        </div>
                      )}
                    </div>

                    {sub.error_message && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-sm text-red-800">
                          {sub.error_message}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Bestätigung
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}