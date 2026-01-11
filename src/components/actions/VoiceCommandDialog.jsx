import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

export default function VoiceCommandDialog({ isOpen, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const location = useLocation();

  const getContextFromUrl = () => {
    const params = new URLSearchParams(location.search);
    let context = {};
    
    if (location.pathname.includes('/building/')) {
      context.buildingId = location.pathname.split('/building/')[1]?.split('/')[0];
    } else if (location.pathname.includes('/unit/')) {
      context.unitId = location.pathname.split('/unit/')[1]?.split('/')[0];
    }
    
    return context;
  };

  const processVoiceCommandMutation = useMutation({
    mutationFn: async (textCommand) => {
      const context = getContextFromUrl();
      const response = await base44.functions.invoke('processVoiceCommand', {
        textCommand,
        context, 
      });
      return response.data; 
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || `Befehl verarbeitet: ${data.intent}`);
        console.log('Processed voice command:', data);
        onClose();
      } else {
        toast.error(data.message || 'Ein unbekannter Fehler ist aufgetreten.');
      }
    },
    onError: (error) => {
      console.error('Error processing voice command:', error);
      toast.error('Fehler bei der Sprachverarbeitung. Bitte erneut versuchen.');
    }
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        // Simulated transcription (will be replaced with STT service)
        const randomCommand = Math.random();
        if (randomCommand < 0.2) {
          setTranscript('erstelle Mietvertrag an Andreas Meyer für Wohnung 3 von Gebäude Hauptstraße 10');
        } else if (randomCommand < 0.4) {
          setTranscript('erstelle Übergabeprotokoll für Wohnung 5');
        } else if (randomCommand < 0.6) {
          setTranscript('erstelle Aufgabe Heizung defekt in Wohnung 2');
        } else if (randomCommand < 0.8) {
          setTranscript('erstelle Angebot für Peter Müller');
        } else {
          setTranscript('melde Problem: Fenster undicht im Badezimmer');
        }

        setIsRecording(false);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript('');
      toast.success('Aufnahme gestartet - bitte sprechen Sie jetzt.');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Mikrofon konnte nicht aktiviert werden. Bitte Berechtigungen prüfen.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      toast.info('Aufnahme beendet - verarbeite Sprachbefehl...');
    }
  };

  const handleSend = () => {
    if (transcript) {
      processVoiceCommandMutation.mutate(transcript);
    } else {
      toast.error('Kein Sprachbefehl vorhanden. Bitte zuerst aufnehmen.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sprachbefehl</DialogTitle>
          <DialogDescription>
            Sprechen Sie Ihren Befehl, z.B. "erstelle Mietvertrag für Andreas Meyer Wohnung 3"
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
            {isRecording ? (
              <>
                <StopCircle className="h-14 w-14 text-red-500 animate-pulse" />
                <span className="absolute -bottom-6 text-xs text-red-600 font-medium">Aufnahme läuft...</span>
              </>
            ) : (
              <Mic className="h-14 w-14 text-blue-600" />
            )}
          </div>
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "w-full",
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
            )}
            disabled={processVoiceCommandMutation.isPending}
          >
            {isRecording ? (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Aufnahme beenden
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Aufnahme starten
              </>
            )}
          </Button>

          {transcript && (
            <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              <p className="font-semibold mb-2 text-slate-900">Transkript:</p>
              <p className="italic">{transcript}</p>
            </div>
          )}

          <Button
            onClick={handleSend}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={!transcript || isRecording || processVoiceCommandMutation.isPending}
          >
            {processVoiceCommandMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verarbeite...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Befehl senden
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}