import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HelpCircle, X, Lightbulb, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const helpContent = {
  invoices: {
    title: 'Rechnungen',
    tips: [
      'Nutzen Sie automatische Kategorisierung für schnellere Eingabe',
      'Verknüpfen Sie Rechnungen mit Verträgen für bessere Übersicht',
      'Setzen Sie Zahlungserinnerungen für fällige Rechnungen'
    ],
    guide: 'Erstellen Sie neue Rechnungen über den "Neu" Button. Alle Pflichtfelder sind mit * gekennzeichnet.'
  },
  contracts: {
    title: 'Verträge',
    tips: [
      'Hinterlegen Sie alle wichtigen Vertragsdaten vollständig',
      'Nutzen Sie Erinnerungen für Kündigungsfristen',
      'Verknüpfen Sie Dokumente direkt mit dem Vertrag'
    ],
    guide: 'Verträge können mit Mietern, Einheiten und Gebäuden verknüpft werden.'
  },
  default: {
    title: 'Hilfe',
    tips: [
      'Nutzen Sie die Suchfunktion für schnellen Zugriff',
      'Filter helfen bei der Organisation großer Datenmengen',
      'Keyboard-Shortcuts beschleunigen die Arbeit'
    ],
    guide: 'Erkunden Sie die Navigation für alle verfügbaren Funktionen.'
  }
};

export default function ContextHelp({ context = 'default' }) {
  const [open, setOpen] = useState(false);
  const content = helpContent[context] || helpContent.default;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="h-8 w-8"
        title="Hilfe zu dieser Seite"
      >
        <HelpCircle className="w-4 h-4 text-slate-400" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-6 z-50 w-80"
            >
              <Card className="shadow-2xl">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Book className="w-5 h-5 text-blue-600" />
                    {content.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm text-slate-700 mb-3">
                      {content.guide}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-slate-700">
                        Tipps
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {content.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}