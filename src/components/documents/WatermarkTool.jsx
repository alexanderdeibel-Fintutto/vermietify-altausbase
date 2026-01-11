import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplet, Loader2 } from 'lucide-react';

export default function WatermarkTool({ documentId }) {
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const queryClient = useQueryClient();

  const watermarkMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('addDocumentWatermark', {
        document_id: documentId,
        watermark_text: watermarkText,
        position: 'diagonal',
        opacity: 0.3
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document'] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Droplet className="w-4 h-4" />
          Wasserzeichen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Wasserzeichen-Text"
          value={watermarkText}
          onChange={(e) => setWatermarkText(e.target.value)}
          className="text-sm"
        />
        <Button
          onClick={() => watermarkMutation.mutate()}
          disabled={!watermarkText || watermarkMutation.isPending}
          className="w-full gap-2"
        >
          {watermarkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Wasserzeichen hinzufügen
        </Button>
        {watermarkMutation.isSuccess && (
          <div className="bg-green-50 p-2 rounded text-xs text-green-700">
            ✓ Wasserzeichen hinzugefügt
          </div>
        )}
      </CardContent>
    </Card>
  );
}