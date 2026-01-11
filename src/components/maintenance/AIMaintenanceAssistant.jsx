import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2, MessageSquare, TrendingUp, Copy, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function AIMaintenanceAssistant({ taskId, buildingId, companyId }) {
  const [analysis, setAnalysis] = useState(null);
  const [vendors, setVendors] = useState(null);
  const [draftMessage, setDraftMessage] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const categorizeMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiMaintenanceAssistant', {
        action: 'categorize_and_prioritize',
        maintenance_task_id: taskId,
        company_id: companyId
      }),
    onSuccess: (response) => setAnalysis(response.data.analysis)
  });

  const vendorsMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiMaintenanceAssistant', {
        action: 'suggest_vendors',
        maintenance_task_id: taskId,
        company_id: companyId
      }),
    onSuccess: (response) => setVendors(response.data.suggestions)
  });

  const draftMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiMaintenanceAssistant', {
        action: 'draft_response',
        maintenance_task_id: taskId,
        company_id: companyId
      }),
    onSuccess: (response) => setDraftMessage(response.data.draft_message)
  });

  const predictMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiMaintenanceAssistant', {
        action: 'predict_issues',
        building_id: buildingId,
        company_id: companyId
      }),
    onSuccess: (response) => setPredictions(response.data.predictions)
  });

  const copyDraft = () => {
    navigator.clipboard.writeText(draftMessage);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Wartungsassistent
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analyze">Analysieren</TabsTrigger>
            <TabsTrigger value="vendors">Dienstleister</TabsTrigger>
            <TabsTrigger value="response">Antwort</TabsTrigger>
            <TabsTrigger value="predict">Vorhersage</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            <Button
              onClick={() => categorizeMutation.mutate()}
              disabled={categorizeMutation.isPending}
              className="w-full"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Anfrage analysieren
            </Button>

            {analysis && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-slate-600 mb-1">Kategorie</p>
                    <Badge>{analysis.category}</Badge>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-slate-600 mb-1">Priorität</p>
                    <Badge className={
                      analysis.priority === 'urgent' ? 'bg-red-600' :
                      analysis.priority === 'high' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }>{analysis.priority}</Badge>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-slate-600 mb-1">Kosten</p>
                    <p className="font-medium text-sm">{analysis.estimated_cost_range}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <p className="text-xs text-slate-600 mb-1">Reaktionszeit</p>
                    <p className="font-medium text-sm">{analysis.recommended_response_time_hours}h</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600 mb-1">KI-Begründung</p>
                  <p className="text-sm">{analysis.reasoning}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Button
              onClick={() => vendorsMutation.mutate()}
              disabled={vendorsMutation.isPending}
              className="w-full"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Dienstleister vorschlagen
            </Button>

            {vendors?.recommended_vendors && (
              <div className="space-y-2">
                {vendors.recommended_vendors.map((v, i) => (
                  <div key={i} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{v.vendor_name}</h4>
                      <Badge variant="outline">#{i + 1}</Badge>
                    </div>
                    <p className="text-xs text-slate-600">{v.reasoning}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            <Button
              onClick={() => draftMutation.mutate()}
              disabled={draftMutation.isPending}
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Antwort generieren
            </Button>

            {draftMessage && (
              <div className="space-y-2">
                <Textarea
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  rows={6}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  onClick={copyDraft}
                  className="w-full"
                >
                  {copiedDraft ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      In Zwischenablage kopieren
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="predict" className="space-y-4">
            <Button
              onClick={() => predictMutation.mutate()}
              disabled={predictMutation.isPending}
              className="w-full"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Probleme vorhersagen
            </Button>

            {predictions && (
              <div className="space-y-4">
                {predictions.high_risk_units?.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Risiko-Einheiten</p>
                    <div className="space-y-2">
                      {predictions.high_risk_units.map((unit, i) => (
                        <div key={i} className="p-3 bg-orange-50 border border-orange-200 rounded">
                          <p className="font-medium text-xs text-orange-900">{unit.unit_id}</p>
                          <p className="text-xs text-orange-700">{unit.predicted_issue}</p>
                          <Badge className="mt-1 text-xs bg-orange-200 text-orange-800">
                            Konfidenz: {unit.confidence}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {predictions.recommended_preventive_actions?.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Präventive Maßnahmen</p>
                    <ul className="space-y-1">
                      {predictions.recommended_preventive_actions.map((action, i) => (
                        <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {predictions.general_insights && (
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-1">KI-Einblicke</p>
                    <p className="text-xs text-blue-700">{predictions.general_insights}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}