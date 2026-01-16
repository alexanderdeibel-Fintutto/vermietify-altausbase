import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Camera, FileText, MessageCircle, HelpCircle, Building2, Euro, Receipt, Mail, Lightbulb, FileSearch } from 'lucide-react';
import BelegScanner from '@/components/ai-features/BelegScanner';
import SteuerbescheidErklaerer from '@/components/ai-features/SteuerbescheidErklaerer';
import SteuerAssistentChat from '@/components/ai-features/SteuerAssistentChat';
import MietvertragPruefer from '@/components/ai-features/MietvertragPruefer';
import FinanzFaqBot from '@/components/ai-features/FinanzFaqBot';
import BuchungsKategorisierer from '@/components/ai-features/BuchungsKategorisierer';
import NebenkostenPruefer from '@/components/ai-features/NebenkostenPruefer';
import BriefGenerator from '@/components/ai-features/BriefGenerator';
import RenditeAnalyse from '@/components/ai-features/RenditeAnalyse';
import DokumentZusammenfasser from '@/components/ai-features/DokumentZusammenfasser';
import SteuerOptimier from '@/components/ai-features/SteuerOptimier';
import PortfolioAnalyse from '@/components/ai-features/PortfolioAnalyse';

export default function AIFeatures() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <Brain className="w-8 h-8" />
                    KI-Features
                </h1>
                <p className="text-slate-600 mt-2">Nutzen Sie intelligente Assistenten für Ihre Immobilienverwaltung</p>
            </div>

            <Tabs defaultValue="scanner" className="mt-6">
                <TabsList className="grid grid-cols-6 lg:grid-cols-12 w-full">
                    <TabsTrigger value="scanner" className="text-xs">
                        <Camera className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Beleg-Scanner</span>
                    </TabsTrigger>
                    <TabsTrigger value="bescheid" className="text-xs">
                        <FileText className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Steuerbescheid</span>
                    </TabsTrigger>
                    <TabsTrigger value="assistent" className="text-xs">
                        <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Steuer-Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="vertrag" className="text-xs">
                        <Building2 className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Mietvertrag</span>
                    </TabsTrigger>
                    <TabsTrigger value="buchungen" className="text-xs">
                        <Receipt className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">SKR03</span>
                    </TabsTrigger>
                    <TabsTrigger value="nebenkosten" className="text-xs">
                        <Euro className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Nebenkosten</span>
                    </TabsTrigger>
                    <TabsTrigger value="rendite" className="text-xs">
                        <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Rendite</span>
                    </TabsTrigger>
                    <TabsTrigger value="brief" className="text-xs">
                        <Mail className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Brief</span>
                    </TabsTrigger>
                    <TabsTrigger value="portfolio" className="text-xs">
                        <Building2 className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Portfolio</span>
                    </TabsTrigger>
                    <TabsTrigger value="zusammenfassung" className="text-xs">
                        <FileSearch className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Dokument</span>
                    </TabsTrigger>
                    <TabsTrigger value="optimierung" className="text-xs">
                        <Lightbulb className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">Optimierung</span>
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="text-xs">
                        <HelpCircle className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                        <span className="hidden lg:inline">FAQ-Bot</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="scanner"><BelegScanner /></TabsContent>
                <TabsContent value="bescheid"><SteuerbescheidErklaerer /></TabsContent>
                <TabsContent value="assistent"><SteuerAssistentChat /></TabsContent>
                <TabsContent value="vertrag"><MietvertragPruefer /></TabsContent>
                <TabsContent value="buchungen"><BuchungsKategorisierer /></TabsContent>
                <TabsContent value="nebenkosten"><NebenkostenPruefer /></TabsContent>
                <TabsContent value="rendite"><RenditeAnalyse /></TabsContent>
                <TabsContent value="brief"><BriefGenerator /></TabsContent>
                <TabsContent value="portfolio"><PortfolioAnalyse /></TabsContent>
                <TabsContent value="zusammenfassung"><DokumentZusammenfasser /></TabsContent>
                <TabsContent value="optimierung"><SteuerOptimier /></TabsContent>
                <TabsContent value="faq"><FinanzFaqBot /></TabsContent>
            </Tabs>
        </div>
    );
}