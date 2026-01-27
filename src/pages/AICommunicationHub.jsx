import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, MessageSquare, Send, TrendingUp } from 'lucide-react';
import AICommunicationInsights from '@/components/communication/AICommunicationInsights';
import AIResponseDrafter from '@/components/communication/AIResponseDrafter';
import PersonalizedUpdateGenerator from '@/components/communication/PersonalizedUpdateGenerator';

export default function AICommunicationHub() {
  const [aiContext, setAiContext] = useState(null);
  const [userPersona, setUserPersona] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  // Load AI context on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        const response = await base44.functions.invoke('loadAIContext');
        if (response.data?.success) {
          setAiContext(response.data);
          // Select appropriate persona based on user type
          const userType = user?.user_type || 'landlord';
          const persona = response.data.personas.find(p => p.user_type === userType);
          setUserPersona(persona);
        }
      } catch (error) {
        console.error('Failed to load AI context:', error);
      }
    };

    if (user?.id) {
      loadContext();
    }
  }, [user?.id]);

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
          <AICommunicationInsights companyId={companyId} aiContext={aiContext} userPersona={userPersona} />
        </TabsContent>

        <TabsContent value="responses" className="mt-4">
          <AIResponseDrafter companyId={companyId} aiContext={aiContext} userPersona={userPersona} />
        </TabsContent>

        <TabsContent value="updates" className="mt-4">
          <PersonalizedUpdateGenerator companyId={companyId} aiContext={aiContext} userPersona={userPersona} />
        </TabsContent>
      </Tabs>
    </div>
  );
}