import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Mic, Camera, Send, Loader2, FileText, Users, Building, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import ActionWorkflowDialog from './ActionWorkflowDialog';

const CONTEXT_ACTIONS = {
  '/buildings': [
    { id: 'create_building', label: 'Gebäude anlegen', icon: Building },
    { id: 'create_maintenance', label: 'Wartung erstellen', icon: FileCheck }
  ],
  '/tenants': [
    { id: 'create_tenant', label: 'Mieter anlegen', icon: Users },
    { id: 'create_contract', label: 'Mietvertrag erstellen', icon: FileText }
  ],
  '/contracts': [
    { id: 'create_contract', label: 'Mietvertrag erstellen', icon: FileText }
  ],
  '/documents': [
    { id: 'create_document', label: 'Dokument erstellen', icon: FileText }
  ],
  'default': [
    { id: 'create_tenant', label: 'Mieter anlegen', icon: Users },
    { id: 'create_contract', label: 'Mietvertrag erstellen', icon: FileText },
    { id: 'create_document', label: 'Dokument erstellen', icon: FileText }
  ]
};

export default function SmartActionDialog({ isOpen, onClose, actionType, actionSubtype }) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [workflowData, setWorkflowData] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const currentPath = window.location.pathname;
  const contextActions = CONTEXT_ACTIONS[currentPath] || CONTEXT_ACTIONS.default;

  // Auto-fill based on action type
  useEffect(() => {
    if (actionType === 'voice') {
      startRecording();
    } else if (actionType === 'photo') {
      fileInputRef.current?.click();
    } else if (actionType === 'document' && actionSubtype) {
      const labels = {
        income: 'Einnahme erstellen',
        expense: 'Ausgabe erstellen',
        contract: 'Mietvertrag erstellen',
        protocol: 'Übergabeprotokoll erstellen',
        invoice: 'Rechnung erstellen'
      };
      setInput(labels[actionSubtype] || '');
    }
  }, [actionType, actionSubtype]);

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
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      toast.info('Sprechen Sie jetzt...');
    } catch (error) {
      toast.error('Mikrofon-Zugriff verweigert');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceInput = async (audioBlob) => {
    setIsProcessing(true);
    try {
      // Upload audio
      const audioFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });

      // Process with backend
      const response = await base44.functions.invoke('processVoiceAction', {
        audio_url: file_url,
        context_path: currentPath,
        photos: photos
      });

      if (response.data.transcript) {
        setInput(response.data.transcript);
      }

      if (response.data.action) {
        handleActionResponse(response.data);
      }
    } catch (error) {
      toast.error('Sprachverarbeitung fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsProcessing(true);
    
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return file_url;
        })
      );
      setPhotos([...photos, ...uploadedUrls]);
      toast.success(`${files.length} Foto(s) hochgeladen`);
    } catch (error) {
      toast.error('Foto-Upload fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() && photos.length === 0) {
      toast.error('Bitte geben Sie eine Anweisung ein oder nehmen Sie ein Foto auf');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await base44.functions.invoke('processTextAction', {
        text: input,
        context_path: currentPath,
        photos: photos
      });

      handleActionResponse(response.data);
    } catch (error) {
      toast.error('Verarbeitung fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionResponse = (data) => {
    if (data.workflow) {
      setWorkflowData(data);
    } else if (data.error) {
      toast.error(data.error);
    } else {
      toast.success('Aktion erfolgreich durchgeführt');
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setInput('');
    setPhotos([]);
    setWorkflowData(null);
  };

  const handleWorkflowComplete = () => {
    setWorkflowData(null);
    onClose();
    resetForm();
    toast.success('Workflow abgeschlossen');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm">⚡</span>
              </div>
              {actionType === 'voice' ? 'Sprachbefehl' :
               actionType === 'photo' ? 'Foto hochladen' :
               actionSubtype ? {
                 income: 'Einnahme',
                 expense: 'Ausgabe',
                 contract: 'Mietvertrag',
                 protocol: 'Übergabeprotokoll',
                 invoice: 'Rechnung'
               }[actionSubtype] : 'Smart Action'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Context Info */}
            {actionSubtype && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-slate-700">
                  {actionSubtype === 'income' && '💰 Einnahme erfassen - Bitte Details angeben'}
                  {actionSubtype === 'expense' && '💸 Ausgabe erfassen - Bitte Details angeben'}
                  {actionSubtype === 'contract' && '📋 Mietvertrag erstellen - Mieter und Vertragsdaten'}
                  {actionSubtype === 'protocol' && '📝 Übergabeprotokoll - Einzug oder Auszug'}
                  {actionSubtype === 'invoice' && '🧾 Rechnung erfassen - Lieferant und Betrag'}
                </p>
              </div>
            )}

            {/* Text Input */}
            <div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Was möchten Sie tun? z.B. 'Mietvertrag für Andreas Müller, Janstraße 11 A, 99423 Weimar erstellen. Er ist beim Jobcenter gemeldet.'"
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-20 object-cover rounded border" />
                    <button
                      onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={isListening ? stopRecording : startRecording}
                variant={isListening ? "destructive" : "outline"}
                className="flex-1"
                disabled={isProcessing}
              >
                <Mic className={`w-4 h-4 mr-2 ${isListening ? 'animate-pulse' : ''}`} />
                {isListening ? 'Aufnahme beenden' : 'Sprechen'}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              >
                <Camera className="w-4 h-4 mr-2" />
                Foto
              </Button>

              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                disabled={isProcessing || (!input.trim() && photos.length === 0)}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Ausführen
              </Button>
            </div>

            {isProcessing && (
              <div className="text-center py-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-slate-600 mt-2">Verarbeite Anfrage...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {workflowData && (
        <ActionWorkflowDialog
          isOpen={!!workflowData}
          onClose={() => setWorkflowData(null)}
          workflowData={workflowData}
          onComplete={handleWorkflowComplete}
        />
      )}
    </>
  );
}