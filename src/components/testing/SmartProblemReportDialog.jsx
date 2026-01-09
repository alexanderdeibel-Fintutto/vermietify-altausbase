import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Send, AlertTriangle, Zap } from 'lucide-react';

export default function SmartProblemReportDialog({ open, onOpenChange }) {
  const [step, setStep] = useState('type'); // type, details, review, submitted
  const [problemType, setProblemType] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [reportedElements, setReportedElements] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [priorityScore, setPriorityScore] = useState(null);

  const handleScreenshot = async () => {
    try {
      const canvas = await html2canvas(document.body);
      const image = canvas.toDataURL('image/png');
      setReportedElements(prev => [...prev, { type: 'screenshot', url: image }]);
      toast.success('Screenshot hinzugefügt');
    } catch (error) {
      toast.error('Screenshot fehler: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Titel und Beschreibung erforderlich');
      return;
    }

    setSubmitting(true);

    try {
      // Calculate priority
      const priorityResponse = await base44.functions.invoke('calculateIntelligentPriority', {
        functional_severity: severity,
        business_impact: 'efficiency_impact',
        ux_severity: severity === 'app_breaking' ? 'unusable' : 'inconvenient',
        affected_user_count_estimate: 'some_users',
        user_journey_stage: 'daily_work'
      });

      if (priorityResponse.data.success) {
        setPriorityScore(priorityResponse.data.priority_score);
      }

      // Create problem report
      const reportData = {
        problem_titel: title,
        problem_beschreibung: description,
        problem_type: problemType,
        functional_severity: severity,
        page_url: window.location.pathname,
        page_title: document.title,
        status: 'open',
        priority_score: priorityResponse.data?.priority_score || 0,
        business_priority: priorityResponse.data?.business_priority || 'p4_low',
        priority_breakdown: priorityResponse.data?.breakdown,
        screenshot_url: reportedElements.find(e => e.type === 'screenshot')?.url,
        expected_behavior: '',
        actual_behavior: description,
        browser_info: {
          user_agent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };

      const createResponse = await base44.functions.invoke('createUserProblem', reportData);

      if (createResponse.data.success) {
        toast.success('Problem erfolgreich gemeldet! 📝');
        setStep('submitted');
        setTimeout(() => {
          onOpenChange(false);
          setStep('type');
          setTitle('');
          setDescription('');
          setProblemType(null);
          setReportedElements([]);
          setSeverity('medium');
        }, 2000);
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Problem melden 🐛</DialogTitle>
          <DialogDescription>
            Hilf uns, die App zu verbessern, indem du Bugs und Probleme meldest.
          </DialogDescription>
        </DialogHeader>

        {step === 'type' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'functional_bug', label: '🔧 Funktionaler Bug', desc: 'App funktioniert nicht richtig' },
                { id: 'ux_issue', label: '😕 UX Problem', desc: 'Verwirrend oder unbenutzbar' },
                { id: 'performance', label: '⚡ Performance', desc: 'Sehr langsam oder friert ein' },
                { id: 'visual_bug', label: '🎨 Visueller Bug', desc: 'Design/Layout Problem' },
                { id: 'feature_request', label: '💡 Feature-Wunsch', desc: 'Neue Funktion vorschlagen' },
                { id: 'data_issue', label: '📊 Daten-Problem', desc: 'Falsche/verlorene Daten' }
              ].map(type => (
                <Card
                  key={type.id}
                  className={`p-4 cursor-pointer transition ${
                    problemType === type.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                  onClick={() => setProblemType(type.id)}
                >
                  <p className="font-light text-slate-800">{type.label}</p>
                  <p className="text-xs font-light text-slate-500">{type.desc}</p>
                </Card>
              ))}
            </div>

            <Button 
              onClick={() => setStep('details')}
              disabled={!problemType}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Weiter
            </Button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-light text-slate-700">Titel</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kurzbeschreibung des Problems"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Beschreibung</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detaillierte Beschreibung"
                rows={4}
                className="w-full mt-1 p-2 border border-slate-200 rounded-lg font-light text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-light text-slate-700">Schweregrad</label>
              <div className="flex gap-2 mt-2">
                {['minor_bug', 'medium', 'high', 'app_breaking'].map(sev => (
                  <Button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    variant={severity === sev ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    {sev === 'minor_bug' ? '😐' : sev === 'medium' ? '😕' : sev === 'high' ? '😠' : '🔥'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setStep('type')}
                variant="outline"
                className="flex-1"
              >
                Zurück
              </Button>
              <Button 
                onClick={() => setStep('review')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Überprüfen
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <Card className="p-4 bg-slate-50 border border-slate-200">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-700">TITEL</p>
                <p className="text-sm font-light text-slate-800">{title}</p>
              </div>
              <div className="space-y-2 mt-3">
                <p className="text-xs font-medium text-slate-700">BESCHREIBUNG</p>
                <p className="text-sm font-light text-slate-800">{description}</p>
              </div>
              <div className="flex gap-4 mt-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">SEITE</p>
                  <p className="text-xs font-light text-slate-600">{window.location.pathname}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">SCHWEREGRAD</p>
                  <p className="text-xs font-light text-slate-600">{severity}</p>
                </div>
              </div>
            </Card>

            {priorityScore !== null && (
              <Card className="p-4 bg-yellow-50 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-light text-yellow-900">Priority Score: {Math.round(priorityScore)}/1000</p>
                    <p className="text-xs font-light text-yellow-800">
                      Dieses Problem hat hohe Priorität für unser Team
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => setStep('details')}
                variant="outline"
                className="flex-1"
              >
                Bearbeiten
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Problem melden
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'submitted' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-light text-slate-800 mb-2">Danke für dein Feedback!</p>
            <p className="text-sm font-light text-slate-600">
              Dein Problem wurde gemeldet und an das Team weitergeleitet.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}