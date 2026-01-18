import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, MessageSquare, Send, TrendingUp } from 'lucide-react';
import AICommunicationInsights from '@/components/communication/AICommunicationInsights';
import AIResponseDrafter from '@/components/communication/AIResponseDrafter';
import PersonalizedUpdateGenerator from '@/components/communication/PersonalizedUpdateGenerator';

export default function AICommunicationHub() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Building.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const companyId = buildings[0]?.company_id;

  if (!companyId) return <div className="text-center py-12">Lade Daten...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          KI-Kommunikationsassistent
        </h1>
        <p className="text-slate-600 mt-1">
          Automatisierte Kommunikation mit Mietern
        </p>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Anfrage-Analyse
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Antworten generieren
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Personalisierte Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <AICommunicationInsights companyId={companyId} />
        </TabsContent>

        <TabsContent value="responses" className="mt-4">
          <AIResponseDrafter companyId={companyId} />
        </TabsContent>

        <TabsContent value="updates" className="mt-4">
          <PersonalizedUpdateGenerator companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}