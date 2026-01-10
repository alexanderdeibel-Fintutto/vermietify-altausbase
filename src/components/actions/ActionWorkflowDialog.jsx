import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2, Mail, Send, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ActionWorkflowDialog({ isOpen, onClose, workflowData, onComplete }) {
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    sendOffer: true,
    recipient: 'tenant',
    communicationMethod: 'email',
    jobcenterEmail: '',
    sendToJobcenter: false
  });

  const steps = [
    {
      title: 'Erstellung bestätigen',
      description: workflowData?.summary || 'Daten werden verarbeitet'
    },
    {
      title: 'Angebot & Versand',
      description: 'Wie soll das Angebot versendet werden?'
    },
    {
      title: 'Abschluss',
      description: 'Workflow wird abgeschlossen'
    }
  ];

  const handleNext = async () => {
    if (step === 0) {
      // Execute creation
      setIsProcessing(true);
      try {
        await base44.functions.invoke('executeWorkflowAction', {
          workflow_id: workflowData.workflow.id,
          action: 'create',
          data: workflowData.extracted_data
        });
        setStep(1);
      } catch (error) {
        toast.error('Erstellung fehlgeschlagen');
      } finally {
        setIsProcessing(false);
      }
    } else if (step === 1) {
      // Handle sending
      setIsProcessing(true);
      try {
        await base44.functions.invoke('executeWorkflowAction', {
          workflow_id: workflowData.workflow.id,
          action: 'send',
          data: {
            ...formData,
            tenant_id: workflowData.entities?.tenant?.id,
            contract_id: workflowData.entities?.contract?.id
          }
        });
        setStep(2);
        setTimeout(() => {
          onComplete();
        }, 2000);
      } catch (error) {
        toast.error('Versand fehlgeschlagen');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow: {workflowData?.workflow?.name}</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                idx === step ? 'bg-blue-600 text-white' :
                idx < step ? 'bg-green-600 text-white' :
                'bg-slate-200 text-slate-600'
              }`}>
                {idx < step ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-20 h-0.5 ${idx < step ? 'bg-green-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">{steps[step].title}</h3>
            <p className="text-sm text-slate-600">{steps[step].description}</p>
          </div>

          {step === 0 && workflowData?.extracted_data && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Extrahierte Daten:</h4>
              {Object.entries(workflowData.extracted_data).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-slate-600">{key}:</span>{' '}
                  <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendOffer"
                  checked={formData.sendOffer}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendOffer: checked })}
                />
                <label htmlFor="sendOffer" className="text-sm">
                  Angebot/Dokument versenden
                </label>
              </div>

              {formData.sendOffer && (
                <>
                  <div>
                    <Label>Empfänger</Label>
                    <Select 
                      value={formData.recipient} 
                      onValueChange={(v) => setFormData({ ...formData, recipient: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tenant">Mieter</SelectItem>
                        <SelectItem value="jobcenter">Jobcenter</SelectItem>
                        <SelectItem value="both">Beide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Kommunikationsweg</Label>
                    <Select 
                      value={formData.communicationMethod} 
                      onValueChange={(v) => setFormData({ ...formData, communicationMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            E-Mail
                          </div>
                        </SelectItem>
                        <SelectItem value="post">
                          <div className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Post (LetterXpress)
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.recipient === 'jobcenter' || formData.recipient === 'both') && (
                    <div>
                      <Label>Jobcenter E-Mail</Label>
                      <Input
                        type="email"
                        value={formData.jobcenterEmail}
                        onChange={(e) => setFormData({ ...formData, jobcenterEmail: e.target.value })}
                        placeholder="jobcenter@weimar.de"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold">Workflow erfolgreich abgeschlossen!</p>
            </div>
          )}
        </div>

        {step < 2 && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleNext} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {step === 1 ? 'Abschließen' : 'Weiter'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}