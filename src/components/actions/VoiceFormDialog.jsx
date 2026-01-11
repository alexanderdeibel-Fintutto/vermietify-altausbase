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
  const [recordingStarted, setRecordingStarted] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = async () => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
      };

      recorder.onerror = (e) => {
        console.error('Recording error:', e);
        toast.error('Fehler bei der Aufnahme');
        stopRecording();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Mikrofon konnte nicht aktiviert werden');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      // Upload audio
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioBlob });

      // Transcribe with LLM
      const transcriptionResponse = await base44.integrations.Core.InvokeLLM({
        prompt: 'Transcribe the following audio. Return only the text transcription, nothing else.',
        file_urls: [file_url]
      });

      const transcribedText = typeof transcriptionResponse === 'string'
        ? transcriptionResponse
        : transcriptionResponse.toString();

      if (!transcribedText || transcribedText.length < 3) {
        toast.error('Konnte Sprachnachricht nicht verstehen');
        setIsProcessing(false);
        return;
      }

      console.log('[VoiceFormDialog] Transcribed:', transcribedText);

      // Analyze intent and extract data
      const response = await base44.functions.invoke('voiceFormIntent', {
        transcribedText
      });

      if (response?.data?.success) {
        setFormData({
          form_type: response.data.form_type,
          confidence: response.data.confidence,
          all_data: response.data.all_data || {},
          essential_data: response.data.essential_data || {}
        });
      } else {
        toast.error(response?.data?.error || 'Konnte Intent nicht erkennen');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Fehler bei der Verarbeitung: ' + (error?.message || ''));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormClose = () => {
    setFormData(null);
    setRecordingStarted(false);
    onClose();
  };

  const handleStartRecording = async () => {
    setRecordingStarted(true);
    await startRecording();
  };

  if (formData) {
    return (
      <Dialog open={isOpen} onOpenChange={handleFormClose}>
        <VoiceFormDisplay
          formType={formData.form_type}
          allData={formData.all_data}
          essentialData={formData.essential_data}
          confidence={formData.confidence}
          onClose={handleFormClose}
        />
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => { stopRecording(); onClose(); }}>
      <DialogContent className="w-full sm:max-w-md p-6 flex flex-col items-center justify-center min-h-[400px]">
        <DialogHeader className="text-center w-full">
          <DialogTitle>Sprachnachricht aufnehmen</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-8 py-8 w-full items-center">
          {!isRecording && !isProcessing && (
            <div className="flex justify-center w-full">
              <button
                onClick={startRecording}
                className="h-28 w-28 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl bg-blue-500 hover:bg-blue-600"
              >
                <Mic className="h-12 w-12 text-white" />
              </button>
            </div>
          )}

          {isRecording && (
            <div className="flex flex-col gap-4 w-full items-center">
              <div className="animate-pulse flex gap-2 justify-center">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-red-600">Aufnahme läuft...</span>
              </div>
              <button
                onClick={stopRecording}
                disabled={isProcessing}
                className="w-full h-20 rounded-2xl flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                <Square className="h-8 w-8 text-white" />
                <span className="text-lg font-bold text-white">Aufnahme beenden</span>
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col gap-4 w-full items-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              <p className="text-base font-semibold text-slate-900">
                Verarbeite Sprachnachricht...
              </p>
            </div>
          )}

          {!isRecording && !isProcessing && (
            <p className="text-center text-sm text-slate-600">
              Zum Starten drücken
            </p>
          )}
        </div>

        {!isRecording && !isProcessing && (
          <div className="flex gap-2 justify-center w-full pt-4 border-t">
            <Button variant="outline" onClick={() => { stopRecording(); onClose(); }} className="flex-1">
              Abbrechen
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}