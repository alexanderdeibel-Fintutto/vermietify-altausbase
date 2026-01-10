import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ContractDataExtractor from '@/components/ai/ContractDataExtractor';
import DocumentAutoCategorization from '@/components/ai/DocumentAutoCategorization';
import ContractRiskAnalyzer from '@/components/ai/ContractRiskAnalyzer';
import AdvancedDocumentSearch from '@/components/documents/AdvancedDocumentSearch';
import { Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AIDocumentAnalysis() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['user-buildings'],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Building.list('-created_date', 1);
    },
    enabled: !!user
  });

  const companyId = buildings[0]?.id || user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">KI-Dokumenten-Analyse</h1>
          <p className="text-slate-600">Automatische Extraktion, Kategorisierung und Risiko-Analyse</p>
        </div>
      </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Dokumentensuche</TabsTrigger>
          <TabsTrigger value="extract">Daten-Extraktion</TabsTrigger>
          <TabsTrigger value="categorize">Auto-Kategorisierung</TabsTrigger>
          <TabsTrigger value="risks">Risiko-Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {companyId && <AdvancedDocumentSearch companyId={companyId} />}
        </TabsContent>

        <TabsContent value="extract" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContractDataExtractor />
            
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-none">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg">Wie funktioniert's?</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>✓ Laden Sie einen Mietvertrag hoch (PDF, JPG, PNG)</p>
                  <p>✓ KI liest und analysiert das Dokument</p>
                  <p>✓ Schlüsseldaten werden automatisch extrahiert</p>
                  <p>✓ Daten können direkt übernommen werden</p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs font-semibold">Unterstützte Sprachen:</p>
                  <p className="text-xs text-slate-600">Deutsch, Englisch, Französisch</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categorize" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentAutoCategorization />
            
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg">Auto-Kategorisierung</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>✓ Dokumente werden automatisch klassifiziert</p>
                  <p>✓ Schlagwörter werden extrahiert</p>
                  <p>✓ Zusammenfassung wird generiert</p>
                  <p>✓ Zuordnung zu Objekten wird vorgeschlagen</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-2 bg-white rounded text-center">
                    <p className="text-2xl font-bold">99%</p>
                    <p className="text-xs text-slate-600">Genauigkeit</p>
                  </div>
                  <div className="p-2 bg-white rounded text-center">
                    <p className="text-2xl font-bold">&lt;3s</p>
                    <p className="text-xs text-slate-600">Analysezeit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ContractRiskAnalyzer />
            
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-none">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg">Risiko-Analyse</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>✓ Erkennung unwirksamer Klauseln</p>
                  <p>✓ Identifikation rechtlicher Risiken</p>
                  <p>✓ Abweichungen vom Standard</p>
                  <p>✓ Konkrete Handlungsempfehlungen</p>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="p-2 bg-white rounded">
                    <p className="text-xs text-slate-600">Geprüfte Aspekte:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['BGB-Konformität', 'Kündigungsfristen', 'Nebenkosten', 'Schönheitsreparaturen', 'Indexmiete'].map(aspect => (
                        <Badge key={aspect} variant="outline" className="text-xs">{aspect}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}