import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Wand2, CheckCircle } from 'lucide-react';

export default function AIResponseDrafter({ companyId }) {
  const [topic, setTopic] = useState('');
  const [draftResponse, setDraftResponse] = useState('');
  const [copied, setCopied] = useState(false);

  const draftMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiCommunicationAnalyzer', {
        action: 'draft_response',
        company_id: companyId,
        question_topic: topic
      }),
    onSuccess: (response) => setDraftResponse(response.data.draft_response)
  });

  const copyResponse = () => {
    navigator.clipboard.writeText(draftResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const commonTopics = [
    'Mietzahlung verspätet',
    'Nebenkostenabrechnung Fragen',
    'Hausordnung Ruhestörung',
    'Kündigung des Mietvertrags',
    'Kaution Rückzahlung',
    'Untermieterlaubnis'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-600" />
          KI-Antwortgenerator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm mb-2 block">Thema / Frage</label>
          <Input
            placeholder="z.B. Mietzahlung zu spät"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {commonTopics.map((t, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                onClick={() => setTopic(t)}
                className="text-xs"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => draftMutation.mutate()}
          disabled={!topic || draftMutation.isPending}
          className="w-full"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Antwort generieren
        </Button>

        {draftResponse && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Generierte Antwort:</label>
            <Textarea
              value={draftResponse}
              onChange={(e) => setDraftResponse(e.target.value)}
              rows={8}
              className="text-sm"
            />
            <Button
              variant="outline"
              onClick={copyResponse}
              className="w-full"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  In Zwischenablage kopieren
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}