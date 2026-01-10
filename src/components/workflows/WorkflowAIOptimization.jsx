import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Lightbulb, Brain, TrendingDown, AlertTriangle } from 'lucide-react';

export default function WorkflowAIOptimization({ companyId, workflowId }) {
  const [nlpDescription, setNlpDescription] = useState('');

  // Analyze bottlenecks
  const bottleneckMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('analyzeWorkflowBottlenecks', {
        company_id: companyId,
        workflow_id: workflowId
      })
  });

  // Create steps from NLP
  const nlpMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createWorkflowStepsFromNLP', {
        company_id: companyId,
        description: nlpDescription
      })
  });

  // Predict delays
  const delayMutation = useMutation({
    mutationFn: (executionId) =>
      base44.functions.invoke('predictWorkflowDelays', {
        company_id: companyId,
        workflow_id: workflowId,
        execution_id: executionId
      })
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="bottlenecks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bottlenecks">Engpässe</TabsTrigger>
          <TabsTrigger value="nlp">NLP Generator</TabsTrigger>
          <TabsTrigger value="delays">Verzögerungen</TabsTrigger>
        </TabsList>

        {/* Bottleneck Analysis */}
        <TabsContent value="bottlenecks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Bottleneck-Analyse & KI-Optimierung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => bottleneckMutation.mutate()}
                disabled={bottleneckMutation.isPending}
                className="w-full"
              >
                {bottleneckMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analysiert...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyse starten
                  </>
                )}
              </Button>

              {bottleneckMutation.data && (
                <div className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-2">
                    <Card className="bg-blue-50">
                      <CardContent className="pt-4">
                        <p className="text-xs text-slate-600">Gesamt</p>
                        <p className="text-2xl font-bold">{bottleneckMutation.data.metrics.total_executions}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50">
                      <CardContent className="pt-4">
                        <p className="text-xs text-slate-600">Erfolg</p>
                        <p className="text-2xl font-bold">{bottleneckMutation.data.metrics.success_rate}%</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50">
                      <CardContent className="pt-4">
                        <p className="text-xs text-slate-600">Ø Dauer</p>
                        <p className="text-2xl font-bold">{bottleneckMutation.data.metrics.average_duration_seconds}s</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50">
                      <CardContent className="pt-4">
                        <p className="text-xs text-slate-600">Fehler</p>
                        <p className="text-2xl font-bold">{bottleneckMutation.data.metrics.failed_executions}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bottlenecks */}
                  {bottleneckMutation.data.bottlenecks.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">🔴 Identifizierte Engpässe</h4>
                      <div className="space-y-2">
                        {bottleneckMutation.data.bottlenecks.map((bn, idx) => (
                          <Alert key={idx} variant={bn.severity === 'critical' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <p className="font-medium">{bn.step_id}</p>
                              <p className="text-sm mt-1">
                                {bn.type === 'slow_step' 
                                  ? `${bn.impact} (Ø ${bn.average_duration}s)`
                                  : `Fehlerrate: ${bn.failure_rate}%`
                                }
                              </p>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Suggestions */}
                  {bottleneckMutation.data.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">💡 KI-Optimierungsvorschläge</h4>
                      <div className="space-y-2">
                        {bottleneckMutation.data.suggestions.slice(0, 5).map((sugg, idx) => (
                          <Card key={idx} className="bg-blue-50">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{sugg.title}</p>
                                  <p className="text-xs text-slate-600 mt-1">{sugg.description}</p>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {sugg.estimated_improvement}
                                    </Badge>
                                    <Badge className={sugg.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                      {sugg.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NLP Workflow Generator */}
        <TabsContent value="nlp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Workflow aus natürlicher Sprache
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Workflow-Beschreibung</label>
                <Textarea
                  value={nlpDescription}
                  onChange={(e) => setNlpDescription(e.target.value)}
                  placeholder="Z.B. 'Erstelle einen Workflow, der E-Mails empfängt, diese in Google Drive speichert, eine Aufgabe zuweist und Slack benachrichtigt'"
                  className="mt-2 h-24"
                />
              </div>

              <Button
                onClick={() => nlpMutation.mutate()}
                disabled={!nlpDescription || nlpMutation.isPending}
                className="w-full"
              >
                {nlpMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generiert...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Schritte generieren
                  </>
                )}
              </Button>

              {nlpMutation.data && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{nlpMutation.data.workflow.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{nlpMutation.data.workflow.description}</p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-medium mb-2">Komplexität: {nlpMutation.data.workflow.estimated_complexity.level}</p>
                    <p className="text-xs text-slate-600">Score: {nlpMutation.data.workflow.estimated_complexity.score}</p>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-2">Generierte Schritte</h5>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {nlpMutation.data.workflow.steps.map((step) => (
                        <Card key={step.id} className="bg-slate-50">
                          <CardContent className="pt-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">Schritt {step.order}: {step.name}</p>
                                <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                                <Badge className="mt-2" variant="outline">
                                  {step.type}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {nlpMutation.data.workflow.integrations_needed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Erforderliche Integrationen</p>
                      <div className="flex flex-wrap gap-2">
                        {nlpMutation.data.workflow.integrations_needed.map((int) => (
                          <Badge key={int}>{int}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delay Prediction */}
        <TabsContent value="delays">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Verzögerungsvorhersage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Wählen Sie eine aktive Workflow-Ausführung aus, um Verzögerungen vorherzusagen
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}