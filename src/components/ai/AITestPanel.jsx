import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AICostDisplay from './AICostDisplay';

export default function AITestPanel() {
  const [prompt, setPrompt] = useState('Was ist eine Nebenkostenabrechnung?');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runTest() {
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const user = await base44.auth.me();
      
      const result = await base44.functions.invoke('aiCoreService', {
        action: 'chat',
        prompt,
        userId: user?.email,
        featureKey: 'chat',
        maxTokens: 512
      });

      if (result.data.success) {
        setResponse(result.data);
      } else {
        setError(result.data.error);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 AI-Service Testen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Test-Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Geben Sie einen Test-Prompt ein..."
          />
        </div>

        <Button onClick={runTest} disabled={loading || !prompt} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verarbeite...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Test durchführen
            </>
          )}
        </Button>

        {response && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-600">Erfolgreich</span>
              <Badge variant="outline">{response.model}</Badge>
            </div>
            
            <div className="p-4 bg-slate-50 rounded border">
              <p className="text-sm whitespace-pre-wrap">{response.content}</p>
            </div>

            {response.usage && <AICostDisplay usage={response.usage} />}
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Budget verbleibend: €{response.budget_remaining?.toFixed(2)}</div>
              <div>Anfragen verbleibend: {response.rate_limit_remaining}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-600">Fehler</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}