import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, Loader2, Archive, Trash2, Lock } from 'lucide-react';
import { format } from 'date-fns';

const CLEANUP_STEPS = ['type', 'categories', 'confirmation'];

export default function AdminTestCleanup() {
  const [testPhases, setTestPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [cleanupOptions, setCleanupOptions] = useState({
    delete_test_objects: true,
    anonymize_personal_data: true,
    archive_insights: true,
    compress_screenshots: false
  });

  const [cleanupType, setCleanupType] = useState('express');
  const [schedule, setSchedule] = useState('immediately');

  // Fetch test phases
  useEffect(() => {
    const fetchPhases = async () => {
      try {
        const phases = await base44.entities.TestPhase.list('-created_date', 20);
        setTestPhases(phases);
      } catch (err) {
        console.error('Failed to fetch phases:', err);
      }
    };
    fetchPhases();
  }, []);

  const activePhase = testPhases.find(p => p.status === 'active');

  const handleStartCleanup = async () => {
    if (!selectedPhase) return;
    setLoading(true);

    try {
      const response = await base44.functions.invoke('executeTestCleanup', {
        test_phase_id: selectedPhase.id,
        cleanup_options: cleanupOptions,
        schedule_type: schedule === 'immediately' ? 'manual' : 'scheduled'
      });

      if (response.data.success) {
        setWizardOpen(false);
        setWizardStep(0);
        // Refresh phases
        const updated = await base44.entities.TestPhase.list('-created_date', 20);
        setTestPhases(updated);
      }
    } catch (err) {
      console.error('Cleanup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-slate-900 mb-2">Test-Phase-Management & Cleanup 🗄️</h1>
          {activePhase && (
            <p className="text-sm font-light text-slate-600">
              📊 Aktive Phase: <strong>{activePhase.phase_name}</strong> ({activePhase.tester_count} Tester, {activePhase.completion_rate}% Completion)
            </p>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Phase Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Phases */}
            <Card className="p-6 border border-slate-200">
              <h2 className="text-lg font-light text-slate-900 mb-4">🟢 Aktive & Archivierte Phasen</h2>
              <div className="space-y-3">
                {testPhases.length > 0 ? (
                  testPhases.map(phase => (
                    <div
                      key={phase.id}
                      onClick={() => setSelectedPhase(phase.id === selectedPhase?.id ? null : phase)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        phase.id === selectedPhase?.id
                          ? 'border-slate-700 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-light text-slate-900">{phase.phase_name}</h3>
                          <p className="text-xs font-light text-slate-500 mt-1">
                            {format(new Date(phase.start_date), 'dd.MM.yyyy')} - {phase.end_date ? format(new Date(phase.end_date), 'dd.MM.yyyy') : 'Laufend'}
                          </p>
                        </div>
                        <Badge
                          className={`font-light ${
                            phase.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : phase.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {phase.status === 'active' ? '🟢 Aktiv' : phase.status === 'completed' ? '✅ Abgeschlossen' : '🗄️ Archiviert'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-light text-slate-600">
                        <span>👥 {phase.tester_count} Tester</span>
                        <span>📊 {phase.completion_rate}% Completion</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-light text-slate-500 text-center py-4">Keine Test-Phasen gefunden</p>
                )}
              </div>
            </Card>

            {/* Data Size Info */}
            <Card className="p-6 border border-slate-200">
              <h2 className="text-lg font-light text-slate-900 mb-4">💾 Speichernutzung</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm font-light text-slate-700 mb-1">
                    <span>Test-Daten Gesamt</span>
                    <span>~2.4 GB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full">
                    <div className="w-full h-2 bg-red-500 rounded-full" />
                  </div>
                </div>
                <div className="text-xs font-light text-slate-600 space-y-1 ml-1">
                  <p>├─ Tester-Aktivitäten: 1.8 GB</p>
                  <p>├─ Problem-Screenshots: 0.4 GB</p>
                  <p>└─ Test-Objekte: 0.2 GB</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Cleanup Card */}
            <Card className="p-6 border border-slate-200 bg-gradient-to-br from-orange-50 to-red-50">
              <h2 className="text-lg font-light text-slate-900 mb-4">🧹 Cleanup durchführen</h2>
              <p className="text-sm font-light text-slate-600 mb-4">
                Was passiert beim Beenden?
              </p>
              <ul className="space-y-2 text-xs font-light text-slate-700 mb-6">
                <li>✅ Tester-Accounts werden deaktiviert</li>
                <li>✅ Persönliche Daten anonymisiert</li>
                <li>✅ Test-Objekte archiviert/gelöscht</li>
                <li>✅ Problem-Reports dauerhaft gespeichert</li>
                <li>✅ UX-Insights für Zukunft behalten</li>
              </ul>
              <p className="text-xs font-light text-red-700 mb-4 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Diese Aktion ist nicht umkehrbar!
              </p>
              <Button
                onClick={() => {
                  if (selectedPhase) {
                    setWizardOpen(true);
                    setWizardStep(0);
                  }
                }}
                disabled={!selectedPhase || loading}
                className="w-full bg-red-600 hover:bg-red-700 font-light"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Phase jetzt beenden
              </Button>
            </Card>
          </div>
        </div>

        {/* Cleanup Wizard Dialog */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🧹 Cleanup-Assistent</DialogTitle>
            </DialogHeader>

            {wizardStep === 0 && (
              <div className="space-y-4">
                <p className="text-sm font-light text-slate-600">Schritt 1: Cleanup-Typ wählen</p>
                <div className="space-y-2">
                  {[
                    { value: 'express', label: '🚀 Express-Cleanup', desc: 'Sichere Anonymisierung' },
                    { value: 'detailed', label: '🔍 Detailliert', desc: 'Granulare Kontrolle' },
                    { value: 'full', label: '🗄️ Vollständige Archivierung', desc: 'Alles anonymisiert' }
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => setCleanupType(type.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        cleanupType === type.value
                          ? 'border-slate-700 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <p className="font-light text-slate-900">{type.label}</p>
                      <p className="text-xs font-light text-slate-500 mt-1">{type.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={() => setWizardOpen(false)} className="font-light">
                    Abbrechen
                  </Button>
                  <Button onClick={() => setWizardStep(1)} className="bg-slate-700 hover:bg-slate-800 font-light">
                    Weiter
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-light text-slate-600">Schritt 2: Daten-Kategorien</p>
                <div className="space-y-3">
                  {[
                    { key: 'delete_test_objects', label: 'Test-Objekte löschen', hint: 'Immobilien, Verträge, etc.' },
                    { key: 'anonymize_personal_data', label: 'Persönliche Daten anonymisieren', hint: 'Namen, E-Mails' },
                    { key: 'archive_insights', label: 'Insights archivieren', hint: 'UX-Learnings behalten' },
                    { key: 'compress_screenshots', label: 'Screenshots komprimieren', hint: 'Speicher sparen' }
                  ].map(option => (
                    <label key={option.key} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <Checkbox
                        checked={cleanupOptions[option.key]}
                        onCheckedChange={checked =>
                          setCleanupOptions({ ...cleanupOptions, [option.key]: checked })
                        }
                      />
                      <div className="flex-1">
                        <p className="font-light text-slate-900">{option.label}</p>
                        <p className="text-xs font-light text-slate-500">{option.hint}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-light text-slate-600 mb-2">Zeitplan</p>
                  <Select value={schedule} onValueChange={setSchedule}>
                    <SelectTrigger className="font-light">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediately">Sofort</SelectItem>
                      <SelectItem value="1day">In 24 Stunden</SelectItem>
                      <SelectItem value="7days">In 7 Tagen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={() => setWizardStep(0)} className="font-light">
                    Zurück
                  </Button>
                  <Button onClick={() => setWizardStep(2)} className="bg-slate-700 hover:bg-slate-800 font-light">
                    Weiter
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-light text-slate-600 mb-4">Schritt 3: Bestätigung</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-light text-red-900 mb-3">⚠️ FINALE BESTÄTIGUNG</p>
                  <ul className="text-xs font-light text-red-800 space-y-1">
                    <li>* Tester-Accounts werden deaktiviert</li>
                    <li>* Test-Objekte werden {cleanupOptions.delete_test_objects ? 'gelöscht' : 'archiviert'}</li>
                    <li>* Persönliche Daten werden {cleanupOptions.anonymize_personal_data ? 'anonymisiert' : 'behalten'}</li>
                    <li>* Backup wird erstellt (30 Tage aufbewahrt)</li>
                  </ul>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={() => setWizardStep(1)} className="font-light">
                    Zurück
                  </Button>
                  <Button
                    onClick={handleStartCleanup}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 font-light"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    Cleanup starten
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}