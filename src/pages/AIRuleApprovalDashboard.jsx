import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import AIRuleApprovalPanel from '@/components/tax/AIRuleApprovalPanel';

export default function AIRuleApprovalDashboard() {
  const [selectedUpdate, setSelectedUpdate] = useState(null);

  const { data: pendingUpdates, isLoading } = useQuery({
    queryKey: ['pendingTaxUpdates'],
    queryFn: async () => {
      const updates = await base44.entities.TaxLawUpdate.filter(
        { status: 'PENDING_REVIEW' },
        '-created_date',
        50
      );
      return updates;
    }
  });

  const { data: implementedUpdates } = useQuery({
    queryKey: ['implementedTaxUpdates'],
    queryFn: async () => {
      const updates = await base44.entities.TaxLawUpdate.filter(
        { status: 'IMPLEMENTED' },
        '-updated_date',
        20
      );
      return updates;
    }
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'IMPLEMENTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Clock className="w-3 h-3" />;
      case 'IMPLEMENTED':
        return <CheckCircle2 className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-light mb-2">AI Regel-Genehmigung</h1>
        <p className="text-slate-600">
          Überprüfen und genehmigen Sie KI-generierte Steuerregeln und Konfigurationen
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Zu überprüfen ({pendingUpdates?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="implemented">
            Implementiert ({implementedUpdates?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingUpdates && pendingUpdates.length > 0 ? (
            <div className="grid gap-4">
              {pendingUpdates.map(update => (
                <Card
                  key={update.id}
                  className={`cursor-pointer transition-all ${
                    selectedUpdate?.id === update.id
                      ? 'border-blue-600 border-2 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedUpdate(selectedUpdate?.id === update.id ? null : update)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{update.title}</CardTitle>
                        <p className="text-sm text-slate-600 mb-2">{update.summary}</p>
                      </div>
                      <Badge className={getStatusColor(update.status)}>
                        {getStatusIcon(update.status)}
                        <span className="ml-1">{update.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>

                  {selectedUpdate?.id === update.id && (
                    <CardContent className="space-y-4 border-t border-slate-200 pt-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Update Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Betroffene Steuerarten</p>
                            <p className="font-medium">{update.affected_tax_types?.join(', ')}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Gültig ab</p>
                            <p className="font-medium">{update.effective_tax_year}</p>
                          </div>
                        </div>
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-xs text-blue-800">
                          {update.suggested_config_changes?.length || 0} Konfigurationen und{' '}
                          {update.suggested_rule_changes?.length || 0} Regeln zur Genehmigung
                        </AlertDescription>
                      </Alert>

                      <AIRuleApprovalPanel taxLawUpdateId={update.id} />
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Keine ausstehenden Genehmigungen. Alle Aktualisierungen wurden überprüft.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="implemented" className="space-y-4">
          {implementedUpdates && implementedUpdates.length > 0 ? (
            <div className="space-y-3">
              {implementedUpdates.map(update => (
                <Card key={update.id} className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{update.title}</CardTitle>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-xs text-slate-600">
                          Genehmigt von: {update.reviewed_by} | {new Date(update.reviewed_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {update.implemented_configs?.length || 0} Konfigurationen
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-300">
              <CardContent className="pt-6 text-center">
                <p className="text-slate-600">Noch keine implementierten Änderungen</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}