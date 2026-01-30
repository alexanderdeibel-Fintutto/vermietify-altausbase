import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSearch, GitCompare, Sparkles } from 'lucide-react';
import AdvancedDocumentAnalyzer from '../components/documents/AdvancedDocumentAnalyzer';
import DocumentComparisonTool from '../components/documents/DocumentComparisonTool';

export default function DocumentAI() {
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">KI-Dokumentverarbeitung</h1>
                <p className="text-gray-600 mt-1">
                    Erweiterte AI-Analyse, Datenextraktion und Dokumentvergleich
                </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <FileSearch className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">Datenextraktion</h3>
                        <p className="text-xs text-gray-600">
                            Automatische Extraktion von Rechnungsdaten, Beträgen, Daten
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">Sentiment-Analyse</h3>
                        <p className="text-xs text-gray-600">
                            Analyse der Tonalität und Stimmung von Dokumenten
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 text-center">
                        <GitCompare className="w-8 h-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">Dokumentvergleich</h3>
                        <p className="text-xs text-gray-600">
                            Vergleich zweier Versionen und Identifikation von Änderungen
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tools */}
            <Tabs defaultValue="analyze" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analyze">
                        <FileSearch className="w-4 h-4 mr-2" />
                        Dokument analysieren
                    </TabsTrigger>
                    <TabsTrigger value="compare">
                        <GitCompare className="w-4 h-4 mr-2" />
                        Dokumente vergleichen
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="analyze" className="mt-6">
                    <AdvancedDocumentAnalyzer />
                </TabsContent>

                <TabsContent value="compare" className="mt-6">
                    <DocumentComparisonTool />
                </TabsContent>
            </Tabs>
        </div>
    );
}