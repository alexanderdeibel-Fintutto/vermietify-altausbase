import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceNoteCapture() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      toast.success('Sprachnotiz gespeichert');
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
      <CardContent className="space-y-3">
        {recording && <Badge className="bg-red-600 animate-pulse">Aufnahme läuft...</Badge>}
        <Button 
          onClick={recording ? stopRecording : startRecording}
          className="w-full"
          variant={recording ? 'destructive' : 'default'}
        >
          {recording ? <Square className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
          {recording ? 'Stoppen' : 'Aufnahme starten'}
        </Button>
      </CardContent>
    </Card>
  );
}