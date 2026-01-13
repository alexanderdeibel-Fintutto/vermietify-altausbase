import React, { useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';

const CHECKLIST_ITEMS = [
  {
    id: 'building',
    label: 'Erstes Gebäude anlegen',
    icon: '🏢',
    page: 'Buildings',
    description: 'Starten Sie mit der Erfassung Ihrer ersten Immobilie',
  },
  {
    id: 'units',
    label: 'Einheiten zum Gebäude hinzufügen',
    icon: '🚪',
    page: 'BuildingDetail',
    description: 'Definieren Sie einzelne Mietwohnungen oder Gewerbeeinheiten',
  },
  {
    id: 'purchase',
    label: 'Kaufvertrag mit Grundstücksanteil',
    icon: '📄',
    page: 'BuildingDetail',
    description: 'Erfassen Sie den Kaufvertrag für korrekte AfA-Berechnung',
  },
  {
    id: 'owners',
    label: 'Eigentümer mit Anteilen zuordnen',
    icon: '👤',
    page: 'BuildingDetail',
    description: 'Definieren Sie Eigentumsanteile für die Gewinnverteilung',
  },
  {
    id: 'contract',
    label: 'Ersten Mietvertrag erstellen',
    icon: '✍️',
    page: 'Tenants',
    description: 'Erstellen Sie einen Mietvertrag für die erste Einheit',
  },
  {
    id: 'bookings',
    label: '"Buchungen generieren" klicken',
    icon: '📊',
    page: 'Finanzen',
    description: 'Generieren Sie automatische Mieteinnahmen (SOLL)',
  },
  {
    id: 'bank',
    label: 'Bankverbindung einrichten',
    icon: '🏦',
    page: 'BankAccounts',
    description: 'Verbinden Sie Ihr Bankkonto für Transaktionen',
  },
  {
    id: 'invoice',
    label: 'Erste Rechnung kategorisieren',
    icon: '💰',
    page: 'Invoices',
    description: 'Kategorisieren Sie eine Rechnung für Betriebskosten',
  },
];

export default function OnboardingChecklist() {
  const [completed, setCompleted] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_completed');
    if (saved) {
      setCompleted(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever completed changes
  useEffect(() => {
    localStorage.setItem('onboarding_completed', JSON.stringify(completed));
  }, [completed]);

  const toggleItem = (id) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const progress = Math.round((completed.length / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between hover:bg-slate-50 p-2 rounded transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-slate-900">🚀 Onboarding</h3>
          <p className="text-xs text-slate-600">{completed.length}/{CHECKLIST_ITEMS.length} abgeschlossen</p>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </button>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-blue-600 rounded-full"
        />
      </div>

      {/* Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {CHECKLIST_ITEMS.map((item) => {
              const isCompleted = completed.includes(item.id);
              return (
                <div key={item.id} className="group">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'border-slate-300 group-hover:border-slate-400'
                      }`}
                    >
                      {isCompleted && <Check className="w-3 h-3 text-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium transition-all ${
                          isCompleted
                            ? 'line-through text-slate-500'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.icon} {item.label}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                    </div>
                  </button>

                  {!isCompleted && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.location.href = createPageUrl(item.page)}
                      className="ml-8 text-xs h-7 text-slate-600 hover:text-slate-900"
                    >
                      Jetzt erledigen →
                    </Button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Message */}
      {completed.length === CHECKLIST_ITEMS.length && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center"
        >
          <p className="text-sm font-medium text-emerald-900">
            ✨ Glückwunsch! Onboarding abgeschlossen.
          </p>
        </motion.div>
      )}
    </div>
  );
}