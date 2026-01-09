import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const CHECKLIST_ITEMS = [
  { id: 'documents', label: 'Mietvertrag & Hausordnung lesen', description: 'Überprüfen Sie alle wichtigen Dokumente' },
  { id: 'payment', label: 'Zahlungsmethode hinzufügen', description: 'Richten Sie Ihre bevorzugte Zahlungsmethode ein' },
  { id: 'portal', label: 'Portal Features kennenlernen', description: 'Erkunden Sie die Funktionen des Mieterportals' },
  { id: 'maintenance', label: 'Inspektionsbericht erstellen', description: 'Dokumentieren Sie den Zustand bei Einzug' },
  { id: 'contact', label: 'Kontaktdaten bestätigen', description: 'Stellen Sie sicher, dass Ihre Kontaktdaten aktuell sind' }
];

export default function OnboardingChecklist({ tenantId, onStepComplete }) {
  const [checkedItems, setCheckedItems] = useState(new Set());
  const items = CHECKLIST_ITEMS;

  useEffect(() => {
    if (checkedItems.size === items.length) {
      onStepComplete?.();
    }
  }, [checkedItems.size, items.length, onStepComplete]);

  const handleToggle = (id) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const completionPercentage = (checkedItems.size / items.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding-Checkliste</CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Schließen Sie alle Aufgaben ab, um Ihre Einrichtung zu vervollständigen
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-900">Fortschritt</p>
            <span className="text-sm text-slate-600">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Checkbox
                id={item.id}
                checked={checkedItems.has(item.id)}
                onChange={() => handleToggle(item.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={item.id}
                  className={`block text-sm font-medium cursor-pointer ${
                    checkedItems.has(item.id) ? 'text-slate-500 line-through' : 'text-slate-900'
                  }`}
                >
                  {item.label}
                </label>
                <p className="text-xs text-slate-600 mt-1">{item.description}</p>
              </div>
              {checkedItems.has(item.id) && (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Completion Status */}
        {checkedItems.size === items.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg text-center"
          >
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-900">Checkliste abgeschlossen!</p>
            <p className="text-sm text-green-700 mt-1">Sie sind bereit, das Portal zu nutzen.</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}