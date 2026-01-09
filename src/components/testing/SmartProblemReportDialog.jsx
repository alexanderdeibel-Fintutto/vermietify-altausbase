import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Send, AlertTriangle, CheckCircle2, Image } from 'lucide-react';

const PROBLEM_TYPES = [
  { value: 'functional_bug', label: '🐛 Fehler - Etwas funktioniert nicht', color: 'bg-red-50' },
  { value: 'ux_issue', label: '😕 Verbesserung - Das könnte besser sein', color: 'bg-yellow-50' },
  { value: 'feature_request', label: '💡 Verwirrung - Ich verstehe etwas nicht', color: 'bg-blue-50' },
  { value: 'performance', label: '⚡ Kritisch - App ist nicht nutzbar', color: 'bg-orange-50' },
  { value: 'visual_bug', label: '🎨 Sonstiges - Anderes Problem', color: 'bg-purple-50' }
];

const SEVERITY_LEVELS = [
  { value: 'app_breaking', label: '🚨 App-Fehler', emoji: '🚨' },
  { value: 'feature_blocking', label: '⛔ Feature blockiert', emoji: '⛔' },
  { value: 'workflow_impacting', label: '⚠️ Arbeitsablauf beeinträchtigt', emoji: '⚠️' },
  { value: 'minor_bug', label: '⚪ Kleiner Fehler', emoji: '⚪' },
  { value: 'cosmetic', label: '✨ Optische Verbesserung', emoji: '✨' }
];

export default function SmartProblemReportDialog({ open, onOpenChange, testAccountId }) {
  const [step, setStep] = useState(1); // 1: Type, 2: Details, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotBase64, setScreenshotBase64] = useState(null);

  const [formData, setFormData] = useState({
    problem_type: 'functional_bug',
    severity: 'minor_bug',
    problem_title: '',
    problem_description: '',
    expected_behavior: '',
    actual_behavior: '',
    steps_to_reproduce: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleCaptureScreenshot = async () => {
    try {
      setLoading(true);
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 1,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshotBase64(dataUrl);
      setScreenshot(dataUrl);
      toast.success('Screenshot erstellt ✅');
    } catch (error) {
      toast.error('Screenshot konnte nicht erstellt werden');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.problem_title || !formData.problem_description) {
      toast.error('Bitte fülle alle erforderlichen Felder aus');
      return;
    }

    try {
      setLoading(true);
      const response = await base44.functions.invoke('submitProblemReport', {
        test_account_id: testAccountId,
        problem_title: formData.problem_title,
        problem_description: formData.problem_description,
        problem_type: formData.problem_type,
        severity: formData.severity,
        page_url: window.location.href,
        page_title: document.title,
        screenshot_base64: screenshotBase64,
        expected_behavior: formData.expected_behavior,
        actual_behavior: formData.actual_behavior,
        steps_to_reproduce: formData.steps_to_reproduce
      });

      if (response.data.success) {
        setSubmitted(true);
        setStep(3);
        toast.success('Problem gemeldet! ✅');
      }
    } catch (error) {
      toast.error('Fehler beim Absenden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({
      problem_type: 'functional_bug',
      severity: 'minor_bug',
      problem_title: '',
      problem_description: '',
      expected_behavior: '',
      actual_behavior: '',
      steps_to_reproduce: ''
    });
    setScreenshot(null);
    setScreenshotBase64(null);
    setSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🐛 Problem melden</DialogTitle>
        </DialogHeader>

        {/* Step 1: Problem Type Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-light text-slate-600">Was ist passiert?</p>
            <div className="space-y-2">
              {PROBLEM_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    setFormData({ ...formData, problem_type: type.value });
                    setStep(2);
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    formData.problem_type === type.value
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-left font-light text-slate-700">{type.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Problem Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-light text-slate-700 mb-1">Titel *</label>
              <Input
                placeholder="Kurze Zusammenfassung des Problems"
                value={formData.problem_title}
                onChange={e => setFormData({ ...formData, problem_title: e.target.value })}
                className="font-light"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-slate-700 mb-1">Beschreibung *</label>
              <Textarea
                placeholder="Was ist genau passiert?"
                value={formData.problem_description}
                onChange={e => setFormData({ ...formData, problem_description: e.target.value })}
                className="font-light h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-slate-700 mb-1">Erwartet</label>
                <Input
                  placeholder="Was sollte passieren?"
                  value={formData.expected_behavior}
                  onChange={e => setFormData({ ...formData, expected_behavior: e.target.value })}
                  className="font-light"
                />
              </div>
              <div>
                <label className="block text-sm font-light text-slate-700 mb-1">Tatsächlich</label>
                <Input
                  placeholder="Was passiert stattdessen?"
                  value={formData.actual_behavior}
                  onChange={e => setFormData({ ...formData, actual_behavior: e.target.value })}
                  className="font-light"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-slate-700 mb-1">Schritte zum Reproduzieren</label>
              <Textarea
                placeholder="1. Schritt 1&#10;2. Schritt 2&#10;3. Schritt 3"
                value={formData.steps_to_reproduce}
                onChange={e => setFormData({ ...formData, steps_to_reproduce: e.target.value })}
                className="font-light h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-slate-700 mb-2">Schweregrad</label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setFormData({ ...formData, severity: level.value })}
                    className={`p-2 rounded-lg border text-xs font-light transition-all ${
                      formData.severity === level.value
                        ? 'border-slate-700 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {level.emoji} {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Screenshot Section */}
            <Card className="p-3 bg-slate-50 border border-dashed border-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-light text-slate-600">
                    {screenshot ? 'Screenshot erstellt ✅' : 'Kein Screenshot'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCaptureScreenshot}
                  disabled={loading}
                  className="text-xs h-8"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '📸 Machen'}
                </Button>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 font-light"
              >
                Zurück
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-slate-700 hover:bg-slate-800 font-light"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Absenden
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-light text-slate-900 mb-2">Problem gemeldet! ✅</h3>
            <p className="text-sm font-light text-slate-600 mb-6">
              Dein Report wurde an Alexander gesendet. Du bekommst Updates über den Status.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 font-light"
              >
                Dashboard
              </Button>
              <Button
                onClick={handleReset}
                className="flex-1 bg-slate-700 hover:bg-slate-800 font-light"
              >
                Weiter testen
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}