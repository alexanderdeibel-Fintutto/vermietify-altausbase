import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const HELP_CONTENT = {
  dashboard_overview: {
    title: 'Dashboard Übersicht',
    description: 'Das Dashboard zeigt einen schnellen Überblick über alle wichtigen Metriken und Aktivitäten.',
    tips: [
      'Nutzen Sie die Filter, um die Ansicht nach Ihren Bedürfnissen anzupassen',
      'Klicken Sie auf die Statistiken, um mehr Details zu erhalten',
      'Sie können die Widgets nach Ihren Vorlieben anordnen',
    ],
  },
};

export default function HelpSystem() {
  const [openContexts, setOpenContexts] = useState({});

  const openHelp = (context) => {
    setOpenContexts(prev => ({ ...prev, [context]: true }));
  };

  const closeHelp = (context) => {
    setOpenContexts(prev => ({ ...prev, [context]: false }));
  };

  return {
    HelpButton: ({ context = 'general' }) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openHelp(context)}
        className="text-slate-400 hover:text-slate-600"
        title="Hilfe"
      >
        <HelpCircle className="w-4 h-4" />
      </Button>
    ),

    HelpDialog: ({ context = 'general' }) => {
      const content = HELP_CONTENT[context] || { title: 'Hilfe', description: '', tips: [] };
      
      return (
        <Dialog open={openContexts[context]} onOpenChange={(open) => {
          if (!open) closeHelp(context);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{content.title}</DialogTitle>
              <DialogDescription>{content.description}</DialogDescription>
            </DialogHeader>
            
            {content.tips && content.tips.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="font-medium text-sm">Tipps:</h4>
                <ul className="space-y-1">
                  {content.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-blue-600">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DialogContent>
        </Dialog>
      );
    },
  };
}