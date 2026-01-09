import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceNoteRecorder({ onTranscriptionComplete }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      toast.error('Mikrofon-Zugriff verweigert');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setTranscribing(true);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      // Convert to base64 for API
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        // Simple approach: use AI to transcribe
        // In production, use dedicated speech-to-text service
        const prompt = `Dies ist eine Sprachnotiz zu einer Zählerablesung. 
        Transkribiere den Text genau.`;
        
        // For now, just provide a simple text input fallback
        const note = prompt("Sprachnotiz (Audio-Transkription in Entwicklung):");
        
        if (note) {
          onTranscriptionComplete(note);
          toast.success('Notiz hinzugefügt');
        }
        
        setTranscribing(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      toast.error('Transkription fehlgeschlagen');
      setTranscribing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!recording && !transcribing && (
        <Button
          variant="outline"
          size="sm"
          onClick={startRecording}
          className="gap-2"
        >
          <Mic className="w-4 h-4" />
          Sprachnotiz
        </Button>
      )}
      
      {recording && (
        <Button
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="gap-2 animate-pulse"
        >
          <Square className="w-4 h-4" />
          Aufnahme beenden
        </Button>
      )}

      {transcribing && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Transkribiere...
        </div>
      )}
    </div>
  );
}