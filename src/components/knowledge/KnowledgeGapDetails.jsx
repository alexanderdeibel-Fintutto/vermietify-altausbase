import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Clock, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function KnowledgeGapDetails({ gap, onClose }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateClaudeReport = async () => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generateClaudeAnalysisReport', {
        gap_type: gap.gap_type,
        description: gap.description,
        context: gap.context_data,
        priority: gap.assigned_priority
      });
      toast.success('Claude-Report wird generiert...');
    } catch (error) {
      toast.error('Report-Generierung fehlgeschlagen');
    } finally {
      setGenerating(false);
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className="sticky top-0 bg-white border-b flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{gap.description}</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Erkannt am {gap.created_date ? new Date(gap.created_date).toLocaleDateString('de-DE') : 'Unbekannt'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-600 font-light"
          >
            ✕
          </button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600">Typ</p>
              <Badge variant="outline" className="mt-1">{gap.gap_type}</Badge>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600">Impact</p>
              <Badge className={`mt-1 ${getImpactColor(gap.business_impact).split(' ')[0]}`}>
                {gap.business_impact}
              </Badge>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600">Häufigkeit</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold">{gap.frequency}x</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs text-slate-600">Priorität</p>
              <p className="font-bold text-lg mt-1">{gap.assigned_priority}/10</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="context">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="context">Kontext</TabsTrigger>
              <TabsTrigger value="impact">Auswirkungen</TabsTrigger>
              <TabsTrigger value="workaround">Workaround</TabsTrigger>
            </TabsList>

            {/* Context Tab */}
            <TabsContent value="context" className="mt-4 space-y-3">
              {gap.context_data ? (
                <div className="p-4 bg-slate-50 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{JSON.stringify(gap.context_data, null, 2)}</pre>
                </div>
              ) : (
                <p className="text-slate-600 text-sm">Kein zusätzlicher Kontext</p>
              )}
            </TabsContent>

            {/* Impact Tab */}
            <TabsContent value="impact" className="mt-4 space-y-3">
              <div className={`p-4 rounded-lg ${getImpactColor(gap.business_impact)}`}>
                <div className="font-semibold mb-2">Business Impact: {gap.business_impact}</div>
                <ul className="text-sm space-y-1">
                  {gap.business_impact === 'CRITICAL' && (
                    <>
                      <li>⚠️ Kritische Systemfunktion beeinträchtigt</li>
                      <li>⚠️ Mehrere User betroffen ({gap.affected_users?.length || 0})</li>
                      <li>⚠️ Sofortige Maßnahmen erforderlich</li>
                    </>
                  )}
                  {gap.business_impact === 'HIGH' && (
                    <>
                      <li>⚠️ Wichtige Funktionalität beeinträchtigt</li>
                      <li>⚠️ {gap.frequency}x Wiederholung beobachtet</li>
                      <li>⚠️ Zeitnahe Lösung empfohlen</li>
                    </>
                  )}
                  {gap.business_impact === 'MEDIUM' && (
                    <>
                      <li>ℹ️ Normale Funktionalität betroffen</li>
                      <li>ℹ️ Lösung in regelmäßigem Zyklus</li>
                    </>
                  )}
                  {gap.business_impact === 'LOW' && (
                    <>
                      <li>ℹ️ Minimale Auswirkung</li>
                      <li>ℹ️ Kann in Backlog aufgenommen werden</li>
                    </>
                  )}
                </ul>
              </div>
            </TabsContent>

            {/* Workaround Tab */}
            <TabsContent value="workaround" className="mt-4">
              {gap.current_workaround ? (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    <strong>Aktuelle Lösung:</strong><br/>
                    {gap.current_workaround}
                  </p>
                </div>
              ) : (
                <p className="text-slate-600 text-sm">Keine bekannte Workaround-Lösung</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Status */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-semibold mb-2">Recherche-Status</p>
            <Badge variant="outline">{gap.research_status}</Badge>
            
            {gap.research_status === 'IDENTIFIED' && (
              <p className="text-xs text-slate-600 mt-2">
                Diese Wissenslücke wurde gerade identifiziert und wartet auf Recherche.
              </p>
            )}
            
            {gap.research_status === 'RESEARCHING' && (
              <p className="text-xs text-slate-600 mt-2">
                Es wird derzeit an einer Lösung für diese Lücke gearbeitet.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateClaudeReport}
              disabled={generating || gap.claude_report_generated}
              className="flex-1"
            >
              {generating ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Wird generiert...
                </>
              ) : gap.claude_report_generated ? (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Claude-Report existiert
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Claude-Analyse anfordern
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}