import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Mail, MessageSquare, Send, Calendar } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function TerminationWorkflowDialog({ isOpen, onClose, terminationAnalysis }) {
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [communicationMethod, setCommunicationMethod] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (terminationAnalysis?.communicationPreferences) {
      setCommunicationMethod(terminationAnalysis.communicationPreferences.primary_method);
    }
    if (terminationAnalysis?.responseOptions?.[0]) {
      setSelectedResponse(terminationAnalysis.responseOptions[0].id);
    }
  }, [terminationAnalysis]);

  const sendResponseMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendTerminationResponse', {
        terminationId: terminationAnalysis.termination.id,
        responseType: selectedResponse,
        communicationMethod,
        customMessage: selectedResponse === 'custom' ? customMessage : null
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Antwort erfolgreich versendet!');
      queryClient.invalidateQueries(['terminations']);
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler beim Versenden: ' + error.message);
    }
  });

  if (!terminationAnalysis) return null;

  const { analysis, responseOptions, communicationPreferences, tenant } = terminationAnalysis;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kündigungsworkflow - {tenant.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Analysis Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Automatische Prüfung
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Kündigungsfrist korrekt:</span>
                  {analysis.isNoticePeriodCorrect ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Ja
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Nein - {Math.abs(analysis.discrepancyDays)} Tage zu früh
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Gewünschtes Auszugsdatum:</span>
                  <span className="font-medium">{new Date(analysis.requestedMoveOutDate).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Korrektes Auszugsdatum:</span>
                  <span className="font-medium">{new Date(analysis.calculatedMoveOutDate).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Kündigungsfrist:</span>
                  <span className="font-medium">{analysis.noticePeriodMonths} Monate</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Options */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Antwort wählen</Label>
            <div className="space-y-2">
              {responseOptions.map(option => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all ${
                    selectedResponse === option.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedResponse(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={selectedResponse === option.id}
                        onChange={() => setSelectedResponse(option.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        {option.correctMoveOutDate && (
                          <p className="text-sm text-slate-600 mt-1">
                            Korrektes Datum: {new Date(option.correctMoveOutDate).toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedResponse === 'custom' && (
            <div>
              <Label>Eigene Nachricht</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Ihre individuelle Antwort..."
                rows={6}
              />
            </div>
          )}

          {/* Communication Method */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Kommunikationsweg</Label>
            <div className="grid grid-cols-2 gap-3">
              {communicationPreferences.allow_in_app && (
                <Card
                  className={`cursor-pointer transition-all ${
                    communicationMethod === 'in_app' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setCommunicationMethod('in_app')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <MessageSquare className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">In-App</p>
                      {communicationPreferences.primary_method === 'in_app' && (
                        <Badge className="mt-1 text-xs">Bevorzugt</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {communicationPreferences.allow_email && (
                <Card
                  className={`cursor-pointer transition-all ${
                    communicationMethod === 'email' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setCommunicationMethod('email')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Mail className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">E-Mail</p>
                      {communicationPreferences.primary_method === 'email' && (
                        <Badge className="mt-1 text-xs">Bevorzugt</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {communicationPreferences.allow_whatsapp && (
                <Card
                  className={`cursor-pointer transition-all ${
                    communicationMethod === 'whatsapp' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setCommunicationMethod('whatsapp')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Send className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">WhatsApp</p>
                      {communicationPreferences.primary_method === 'whatsapp' && (
                        <Badge className="mt-1 text-xs">Bevorzugt</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {communicationPreferences.allow_postal && (
                <Card
                  className={`cursor-pointer transition-all ${
                    communicationMethod === 'postal' ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setCommunicationMethod('postal')}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Mail className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Postversand</p>
                      {communicationPreferences.primary_method === 'postal' && (
                        <Badge className="mt-1 text-xs">Bevorzugt</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => sendResponseMutation.mutate()}
            disabled={!selectedResponse || !communicationMethod || sendResponseMutation.isPending}
          >
            {sendResponseMutation.isPending ? 'Sende...' : 'Antwort senden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}