import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Save } from 'lucide-react';
import { toast } from 'sonner';
import VoiceNoteRecorder from '@/components/meters/VoiceNoteRecorder';

export default function VoiceRecorder({ onSave }) {
  const [transcript, setTranscript] = useState('');

  const handleSave = () => {
    if (transcript) {
      onSave?.(transcript);
      toast.success('Notiz gespeichert');
      setTranscript('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Sprachnotiz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <VoiceNoteRecorder
          onTranscriptionComplete={(text) => setTranscript(prev => prev + ' ' + text)}
        />
        
        {transcript && (
          <>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm">{transcript}</p>
            </div>
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Notiz speichern
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}