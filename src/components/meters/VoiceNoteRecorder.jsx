import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceNoteRecorder({ onTranscriptionComplete }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [useWebSpeechAPI, setUseWebSpeechAPI] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setUseWebSpeechAPI(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'de-DE';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        
        if (transcript) {
          onTranscriptionComplete(transcript);
          toast.success('Sprachnotiz transkribiert');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Spracherkennung fehlgeschlagen');
        setRecording(false);
      };

      recognitionRef.current.onend = () => {
        setRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (useWebSpeechAPI && recognitionRef.current) {
      // Use Web Speech API
      try {
        recognitionRef.current.start();
        setRecording(true);
        toast.success('Sprechen Sie jetzt...');
      } catch (error) {
        toast.error('Spracherkennung konnte nicht gestartet werden');
      }
    } else {
      // Fallback to manual input
      const note = prompt("Sprachnotiz eingeben:");
      if (note) {
        onTranscriptionComplete(note);
        toast.success('Notiz hinzugefügt');
      }
    }
  };

  const stopRecording = () => {
    if (useWebSpeechAPI && recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
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