import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InteractiveFeatureTour({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Willkommen zur Feature-Tour',
      description: 'Entdecken Sie die wichtigsten Funktionen Ihrer Immobilienverwaltung',
      highlight: null
    },
    {
      title: 'Dashboard',
      description: 'Ihr zentraler Überblick: Alle KPIs, Statistiken und Quick-Actions auf einen Blick',
      highlight: 'dashboard'
    },
    {
      title: 'KI-Autopilot',
      description: 'Automatische Steueroptimierung spart durchschnittlich 7.450€ pro Jahr',
      highlight: 'autopilot'
    },
    {
      title: 'Echtzeit-Cashflow',
      description: 'Live-Überwachung Ihrer Einnahmen und Ausgaben mit Prognosen',
      highlight: 'cashflow'
    },
    {
      title: 'Mobile Features',
      description: 'Barcode-Scanner, GPS-Tracking und Sprachnotizen für unterwegs',
      highlight: 'mobile'
    }
  ];

  const next = () => setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
  const prev = () => setCurrentStep(Math.max(currentStep - 1, 0));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <Badge className="bg-purple-600">
                    Schritt {currentStep + 1} von {steps.length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
                <p className="text-slate-600">{steps[currentStep].description}</p>
              </div>

              {steps[currentStep].highlight && (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-blue-800">
                    💡 Tipp: Diese Funktion finden Sie im Hauptmenü unter "{steps[currentStep].highlight}"
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prev} disabled={currentStep === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Zurück
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button onClick={next}>
                    Weiter
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={onClose} className="bg-green-600">
                    Tour beenden
                  </Button>
                )}
              </div>

              <div className="flex gap-1 justify-center pt-2">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStep ? 'bg-blue-600 w-8' : 'bg-slate-300 w-1.5'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}