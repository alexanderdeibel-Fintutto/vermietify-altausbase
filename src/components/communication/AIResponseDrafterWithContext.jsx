import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIResponseDrafterWithContext({ companyId, aiContext, userPersona }) {
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [crossSellRecommendation, setCrossSellRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateResponse = async () => {
    if (!userMessage.trim()) return;

    try {
      setLoading(true);

      // Check for cross-sell opportunities
      const crossSellResponse = await base44.functions.invoke('checkCrossSell', {
        userMessage
      });

      if (crossSellResponse.data?.recommendation) {
        setCrossSellRecommendation(crossSellResponse.data.recommendation);
      }

      // Call KI Service
      const kiResponse = await base44.functions.invoke('callKIService', {
        action: 'generate_response',
        message: userMessage,
        conversation_type: 'tenant_communication',
        user_tier: userPersona?.tier || 'free'
      });

      if (kiResponse.data?.success) {
        let response = kiResponse.data.response;

        // Append cross-sell recommendation if available
        if (crossSellResponse.data?.recommendation) {
          response += '\n\n💡 ' + crossSellResponse.data.recommendation.message;
        }

        setAiResponse(response);
      } else {
        toast.error('KI-Service fehlgeschlagen');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <textarea
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Geben Sie die Mieter-Nachricht ein..."
          className="w-full h-24 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2 mt-4">
          <Button
            onClick={generateResponse}
            disabled={loading || !userMessage.trim()}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Generiere...' : 'KI-Antwort generieren'}
          </Button>
        </div>
      </Card>

      {crossSellRecommendation && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Empfehlung</p>
              <p className="text-sm text-blue-800">{crossSellRecommendation.message}</p>
            </div>
          </div>
        </Card>
      )}

      {aiResponse && (
        <Card className="p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">KI-generierte Antwort:</p>
          <p className="text-gray-900 whitespace-pre-wrap">{aiResponse}</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2">
            <Send className="w-4 h-4" />
            Als Antwort senden
          </Button>
        </Card>
      )}
    </div>
  );
}