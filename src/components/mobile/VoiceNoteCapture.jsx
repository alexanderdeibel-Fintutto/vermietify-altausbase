import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mic, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceNoteCapture() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const processMutation = useMutation({
    mutationFn: async (audioBlob) => {
      const file = new File([audioBlob], 'voice_note.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: 'Transkribiere diese Sprachnotiz und extrahiere wichtige Informationen (Beträge, Daten, Namen)',
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            transcription: { type: 'string' },
            entities: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      
      return response;
    },
    onSuccess: (data) => {
      toast.success('Sprachnotiz verarbeitet');
      console.log('Transkription:', data.transcription);
    }
  });

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      processMutation.mutate(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Sprachnotizen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={recording ? stopRecording : startRecording}
          className={recording ? 'w-full bg-red-600' : 'w-full'}
        >
          {recording ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Aufnahme beenden
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Aufnahme starten
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}