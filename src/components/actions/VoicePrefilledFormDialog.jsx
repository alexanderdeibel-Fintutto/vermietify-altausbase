import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function VoicePrefilledFormDialog({ 
  isOpen, 
  onClose, 
  result,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  renderForm
}) {
  if (!result) return null;

  const getTitle = () => {
    switch(result.intent) {
      case 'CreateLeaseContract': return 'Mietvertrag erstellen';
      case 'CreateHandoverProtocol': return 'Übergabeprotokoll erstellen';
      case 'CreateTask': return 'Aufgabe erstellen';
      case 'CreateNote': return 'Notiz erstellen';
      case 'CreateMaintenanceTask': return 'Wartungsaufgabe erstellen';
      case 'CreateOffer': return 'Angebot erstellen';
      default: return 'Formular';
    }
  };

  const hasMissingFields = result.missingFields && result.missingFields.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {hasMissingFields && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mt-2">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-900">Fehlende Pflichtfelder</p>
                <p className="text-orange-700">Bitte füllen Sie die orange markierten Felder aus.</p>
              </div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4">
          {renderForm()}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstelle...
                </>
              ) : (
                'Erstellen'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}