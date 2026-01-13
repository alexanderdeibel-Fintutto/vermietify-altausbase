import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, DollarSign, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function PostContractDialog({ contractId, open, onOpenChange }) {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState({});

  const actions = [
    { id: 'bookings', label: 'Buchungen generieren (12 Monate)', icon: DollarSign, action: () => navigate(createPageUrl('GeneratedBookings')) },
    { id: 'document', label: 'Mietvertrag-Dokument erstellen', icon: FileText, action: () => navigate(createPageUrl('DocumentGeneration')) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <DialogTitle>Vertrag erfolgreich erstellt! ✅</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-slate-600">Nächste empfohlene Schritte:</p>
          
          <div className="space-y-2">
            {actions.map(action => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="w-full justify-between h-auto py-3 px-4"
                  onClick={() => {
                    action.action();
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-left">{action.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => onOpenChange(false)}
          >
            Später erledigen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}