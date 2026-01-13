import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function PostContractDialog({ open, onOpenChange, contractId }) {
  const nextSteps = [
    { done: false, text: 'Buchungen generieren (12 Monate)', action: 'Jetzt generieren', link: 'GeneratedBookings' },
    { done: false, text: 'Mietvertrag-Dokument erstellen', action: 'Dokument erstellen', link: 'Documents' },
    { done: false, text: 'Kaution als Zahlung erfassen', action: 'Zur Kautionsverwaltung', link: 'Payments' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            ✅ Vertrag erfolgreich erstellt!
          </DialogTitle>
          <DialogDescription>
            Du bist auf dem richtigen Weg. Folge diesen nächsten Schritten:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {nextSteps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                checked={step.done}
                readOnly
                className="w-5 h-5 cursor-default"
              />
              <span className="flex-1 text-sm">{step.text}</span>
              <Link to={createPageUrl(step.link)}>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  {step.action}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Später erledigen
          </Button>
          <Link to={createPageUrl('GeneratedBookings')} className="flex-1">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              Buchungen jetzt generieren →
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}