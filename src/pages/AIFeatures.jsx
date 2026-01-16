import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Camera, FileText, MessageCircle, HelpCircle, Building2, Euro } from 'lucide-react';
import BelegScanner from '@/components/ai-features/BelegScanner';
import SteuerbescheidErklaerer from '@/components/ai-features/SteuerbescheidErklaerer';
import SteuerAssistentChat from '@/components/ai-features/SteuerAssistentChat';
import MietvertragPruefer from '@/components/ai-features/MietvertragPruefer';
import FinanzFaqBot from '@/components/ai-features/FinanzFaqBot';

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

            <Tabs defaultValue="scanner">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="scanner">
                        <Camera className="w-4 h-4 mr-2" />
                        Beleg-Scanner
                    </TabsTrigger>
                    <TabsTrigger value="bescheid">
                        <FileText className="w-4 h-4 mr-2" />
                        Steuerbescheid
                    </TabsTrigger>
                    <TabsTrigger value="assistent">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Steuer-Chat
                    </TabsTrigger>
                    <TabsTrigger value="vertrag">
                        <Building2 className="w-4 h-4 mr-2" />
                        Mietvertrag
                    </TabsTrigger>
                    <TabsTrigger value="faq">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        FAQ-Bot
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="scanner">
                    <BelegScanner />
                </TabsContent>

                <TabsContent value="bescheid">
                    <SteuerbescheidErklaerer />
                </TabsContent>

                <TabsContent value="assistent">
                    <SteuerAssistentChat />
                </TabsContent>

                <TabsContent value="vertrag">
                    <MietvertragPruefer />
                </TabsContent>

                <TabsContent value="faq">
                    <FinanzFaqBot />
                </TabsContent>
            </Tabs>
        </div>
    );
}