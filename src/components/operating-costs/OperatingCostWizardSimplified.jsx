import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

export default function OperatingCostWizardSimplified() {
  const [step, setStep] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCosts, setSelectedCosts] = useState([]);

  const progress = (step / 4) * 100;

  const steps = [
    { number: 1, title: 'Objekt & Zeitraum', icon: '📍' },
    { number: 2, title: 'Kosten auswählen', icon: '💰' },
    { number: 3, title: 'Prüfen & Korrigieren', icon: '✓' },
    { number: 4, title: 'Vorschau & Generieren', icon: '📊' },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            Betriebskostenabrechnung
          </h1>
          <span className="text-sm text-slate-600">
            Schritt {step}/4
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex gap-2 justify-between">
        {steps.map((s) => (
          <div
            key={s.number}
            className={`flex-1 text-center p-3 rounded-lg border-2 transition-all ${
              step === s.number
                ? 'bg-blue-50 border-blue-500'
                : step > s.number
                ? 'bg-emerald-50 border-emerald-500'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-lg">{s.icon}</div>
            <p className="text-xs font-medium mt-1">{s.title}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Objekt & Zeitraum */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gebäude & Zeitraum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Gebäude auswählen *</Label>
                <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gebäude wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="building_1">Musterstraße 1</SelectItem>
                    <SelectItem value="building_2">Beispielweg 42</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Abrechnungszeitraum Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, 'dd.MM.yyyy', { locale: de })
                          : 'Datum wählen'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Abrechnungszeitraum Ende</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate
                          ? format(endDate, 'dd.MM.yyyy', { locale: de })
                          : 'Datum wählen'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedBuilding || !startDate || !endDate}
              className="gap-2"
            >
              Weiter <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Kosten auswählen */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Umlagefähige Kosten</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Nur kategorisierte, umlagefähige Rechnungen werden angezeigt.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {['Müllabfuhr 500€', 'Hausmeisterdienste 800€', 'Straßenreinigung 300€'].map(
                (cost, idx) => (
                  <label key={idx} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCosts([...selectedCosts, cost]);
                        } else {
                          setSelectedCosts(selectedCosts.filter((c) => c !== cost));
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-slate-900">{cost}</span>
                  </label>
                )
              )}

              <a
                href={createPageUrl('Invoices')}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-4"
              >
                <AlertCircle className="w-4 h-4" />
                Fehlende Kosten? Zur Rechnungs-Kategorisierung
              </a>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Zurück
            </Button>
            <Button onClick={() => setStep(3)} className="gap-2">
              Weiter <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Prüfen & Korrigieren */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Übersicht vor Generierung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>Gebäude:</strong> {selectedBuilding || '-'}
              </p>
              <p>
                <strong>Zeitraum:</strong>{' '}
                {startDate && endDate
                  ? `${format(startDate, 'dd.MM.yyyy', { locale: de })} - ${format(endDate, 'dd.MM.yyyy', { locale: de })}`
                  : '-'}
              </p>
              <p>
                <strong>Kosten:</strong> {selectedCosts.length} ausgewählt
              </p>
              <p>
                <strong>Gesamtbetrag:</strong> 1.600€
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              Zurück
            </Button>
            <Button onClick={() => setStep(4)} className="gap-2">
              Weiter <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Vorschau & Generieren */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-lg">✅ Fertig zum Generieren</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-900">
                Die Betriebskostenabrechnung wird jetzt für alle Mieter erstellt und verteilt.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(3)}>
              Zurück
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
              alert('Abrechnung generiert!');
              setStep(1);
            }}>
              Abrechnung generieren
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}