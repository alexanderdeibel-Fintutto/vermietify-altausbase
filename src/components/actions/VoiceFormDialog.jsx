import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import VoiceFormDisplay from './VoiceFormDisplay';

export default function VoiceFormDialog({ isOpen, onClose }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      toast.error('Mikrofon konnte nicht aktiviert werden');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      // Upload audio
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioBlob });

      // Transcribe with LLM
      const transcription = await base44.integrations.Core.InvokeLLM({
        prompt: 'Transcribe the following audio and extract the text content.',
        file_urls: [file_url]
      });

      // Analyze intent and extract data
      const response = await base44.functions.invoke('voiceFormIntent', {
        transcribedText: transcription
      });

      if (response.data.success) {
        setFormData({
          form_type: response.data.form_type,
          confidence: response.data.confidence,
          all_data: response.data.all_data,
          essential_data: response.data.essential_data
        });
      } else {
        toast.error('Konnte Intent nicht erkennen');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Fehler bei der Verarbeitung');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormClose = () => {
    setFormData(null);
    onClose();
  };

  // Show form display if we have data
  if (formData) {
    return (
      <VoiceFormDisplay
        isOpen={isOpen}
        onClose={handleFormClose}
        formType={formData.form_type}
        allData={formData.all_data}
        essentialData={formData.essential_data}
        confidence={formData.confidence}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sprachnachricht aufnehmen</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-6">
          <div className="flex justify-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : isRecording ? (
                <Square className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>
          </div>

          <p className="text-center text-sm text-slate-600">
            {isProcessing
              ? 'Verarbeite Sprachnachricht...'
              : isRecording
              ? 'Aufnahme läuft... Klick zum Beenden'
              : 'Klick zum Starten'}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}