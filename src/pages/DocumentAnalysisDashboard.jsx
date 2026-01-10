import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, FileText, ExternalLink, TrendingUp, Eye } from 'lucide-react';
import DocumentAnalysisResults from '@/components/actions/DocumentAnalysisResults';
import { toast } from 'sonner';

export default function DocumentAnalysisDashboard() {
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const queryClient = useQueryClient();

  const { data: analyses = [] } = useQuery({
    queryKey: ['document-analyses'],
    queryFn: () => base44.entities.DocumentAnalysis.list('-created_date', 100)
  });

  const approveMutation = useMutation({
    mutationFn: async (analysisId) => {
      const analysis = analyses.find(a => a.id === analysisId);
      
      // Create financial item
      const financialItem = await base44.entities.FinancialItem.create({
        type: analysis.document_type === 'invoice' ? 'expense' : 'income',
        category: analysis.category || 'general',
        amount: analysis.amount,
        date: analysis.date,
        description: `${analysis.vendor_name || 'Unbekannt'} - ${analysis.invoice_number || ''}`,
        building_id: analysis.building_id,
        invoice_number: analysis.invoice_number,
        notes: 'Aus Dokumentenanalyse erstellt'
      });

      // Update analysis
      await base44.entities.DocumentAnalysis.update(analysisId, {
        financial_item_id: financialItem.id,
        status: 'linked'
      });

      return financialItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['document-analyses']);
      toast.success('Buchung erstellt');
      setSelectedAnalysis(null);
    }
  });

  const pending = analyses.filter(a => a.status === 'pending');
  const reviewed = analyses.filter(a => a.status === 'reviewed');
  const linked = analyses.filter(a => a.status === 'linked');

  const AnalysisCard = ({ analysis }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedAnalysis(analysis)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">
              {analysis.vendor_name || analysis.tenant_name || 'Unbekannt'}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {new Date(analysis.created_date).toLocaleDateString('de-DE')}
            </p>
          </div>
          <Badge variant={
            analysis.confidence_score > 0.8 ? 'default' :
            analysis.confidence_score > 0.5 ? 'secondary' : 'outline'
          }>
            {(analysis.confidence_score * 100).toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium">
              {analysis.document_type === 'invoice' && 'Rechnung'}
              {analysis.document_type === 'receipt' && 'Beleg'}
              {analysis.document_type === 'contract' && 'Vertrag'}
              {analysis.document_type === 'protocol' && 'Protokoll'}
            </span>
          </div>
          <p className="text-lg font-bold">
            {analysis.amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dokumentenanalyse</h1>
          <p className="text-slate-600 mt-1">KI-gestützte Belegerfassung</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Zu prüfen</p>
                <p className="text-2xl font-bold">{pending.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Geprüft</p>
                <p className="text-2xl font-bold">{reviewed.length}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Verbucht</p>
                <p className="text-2xl font-bold">{linked.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Zu prüfen ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Geprüft ({reviewed.length})
          </TabsTrigger>
          <TabsTrigger value="linked">
            Verbucht ({linked.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Keine ausstehenden Analysen</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map(analysis => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewed.map(analysis => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="linked" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linked.map(analysis => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Analyse-Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAnalysis(null)}>
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DocumentAnalysisResults
                analysis={selectedAnalysis}
                onApprove={() => approveMutation.mutate(selectedAnalysis.id)}
                onEdit={() => toast.info('Bearbeiten')}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}