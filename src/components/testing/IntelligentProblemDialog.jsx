import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, ChevronRight, Camera } from 'lucide-react';

export default function IntelligentProblemDialog({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    problem_titel: '',
    problem_beschreibung: '',
    problem_type: '',
    functional_severity: '',
    ux_severity: '',
    business_area: '',
    business_impact: '',
    user_journey_stage: '',
    affected_user_count_estimate: '',
    expected_behavior: '',
    actual_behavior: '',
    steps_to_reproduce: [''],
    functional_details: {
      causes_data_loss: false,
      breaks_core_workflow: false,
      has_workaround: false,
      affects_multiple_users: false,
      reproducible: 'sometimes'
    },
    ux_details: {
      prevents_task_completion: false,
      requires_external_help: false,
      increases_task_time_significantly: false,
      violates_ui_consistency: false,
      accessibility_issue: false
    },
    business_details: {
      affects_billing: false,
      affects_legal_compliance: false,
      affects_daily_workflow: false,
      affects_onboarding: false,
      affects_data_accuracy: false
    }
  });

  useEffect(() => {
    if (open) {
      const currentPage = window.location.pathname;
      const pageTitle = document.title;
      
      const areaMap = {
        '/login': 'auth_login',
        '/finanzen': 'finances',
        '/bank': 'finances',
        '/buildings': 'objects',
        '/contracts': 'tenants',
        '/documents': 'documents',
        '/tax': 'taxes',
        '/operating-costs': 'operating_costs',
        '/dashboard': 'dashboard'
      };

      const detectedArea = Object.entries(areaMap).find(([path]) => 
        currentPage.includes(path)
      )?.[1] || 'settings';

      setFormData(prev => ({
        ...prev,
        page_url: currentPage,
        page_title: pageTitle,
        business_area: detectedArea
      }));
    }
  }, [open]);

  const handleAddStep = () => {
    setFormData(prev => ({
      ...prev,
      steps_to_reproduce: [...prev.steps_to_reproduce, '']
    }));
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...formData.steps_to_reproduce];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, steps_to_reproduce: newSteps }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();

      const reportData = {
        ...formData,
        tester_id: user.id,
        tester_name: user.full_name,
        browser_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        },
        viewport_size: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        steps_to_reproduce: formData.steps_to_reproduce.filter(s => s.trim())
      };

      const createdReport = await base44.entities.UserProblem.create(reportData);

      await base44.functions.invoke('calculateIntelligentPriority', {
        report_id: createdReport.id
      });

      await base44.functions.invoke('findSimilarReportsIntelligent', {
        report_id: createdReport.id
      });

      await base44.functions.invoke('handleIntelligentNotifications', {
        report_id: createdReport.id
      });

      toast.success('Problem erfolgreich gemeldet und analysiert! 🎯');
      onOpenChange(false);
      setStep(1);
      setFormData({
        problem_titel: '',
        problem_beschreibung: '',
        problem_type: '',
        functional_severity: '',
        ux_severity: '',
        business_area: '',
        business_impact: '',
        user_journey_stage: '',
        affected_user_count_estimate: '',
        expected_behavior: '',
        actual_behavior: '',
        steps_to_reproduce: [''],
        functional_details: {
          causes_data_loss: false,
          breaks_core_workflow: false,
          has_workaround: false,
          affects_multiple_users: false,
          reproducible: 'sometimes'
        },
        ux_details: {
          prevents_task_completion: false,
          requires_external_help: false,
          increases_task_time_significantly: false,
          violates_ui_consistency: false,
          accessibility_issue: false
        },
        business_details: {
          affects_billing: false,
          affects_legal_compliance: false,
          affects_daily_workflow: false,
          affects_onboarding: false,
          affects_data_accuracy: false
        }
      });
    } catch (error) {
      console.error('Error submitting problem:', error);
      toast.error('Fehler beim Melden des Problems');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch(step) {
      case 1:
        return formData.problem_titel && formData.problem_beschreibung && formData.problem_type;
      case 2:
        if (formData.problem_type === 'functional_bug') {
          return formData.functional_severity;
        }
        if (formData.problem_type === 'ux_issue') {
          return formData.ux_severity;
        }
        return true;
      case 3:
        return formData.business_area && formData.business_impact;
      case 4:
        return formData.user_journey_stage && formData.affected_user_count_estimate;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Problem intelligent melden
          </DialogTitle>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i <= step ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div>
                <Label>Was ist das Problem? *</Label>
                <Input
                  value={formData.problem_titel}
                  onChange={(e) => setFormData(prev => ({ ...prev, problem_titel: e.target.value }))}
                  placeholder="z.B. Login-Button funktioniert nicht"
                />
              </div>

              <div>
                <Label>Beschreibung *</Label>
                <Textarea
                  value={formData.problem_beschreibung}
                  onChange={(e) => setFormData(prev => ({ ...prev, problem_beschreibung: e.target.value }))}
                  placeholder="Detaillierte Beschreibung des Problems..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Problem-Typ *</Label>
                <Select value={formData.problem_type} onValueChange={(val) => setFormData(prev => ({ ...prev, problem_type: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional_bug">🐛 Funktionaler Bug</SelectItem>
                    <SelectItem value="ux_issue">🎨 UX/Usability Problem</SelectItem>
                    <SelectItem value="performance">⚡ Performance-Problem</SelectItem>
                    <SelectItem value="visual_bug">👁️ Visueller Bug</SelectItem>
                    <SelectItem value="data_integrity">📊 Daten-Problem</SelectItem>
                    <SelectItem value="security">🔒 Sicherheits-Problem</SelectItem>
                    <SelectItem value="feature_request">💡 Feature-Wunsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bereich (automatisch erkannt)</Label>
                <Badge className="mt-2">{formData.business_area}</Badge>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              {formData.problem_type === 'functional_bug' && (
                <>
                  <div>
                    <Label>Funktionale Schwere *</Label>
                    <Select value={formData.functional_severity} onValueChange={(val) => setFormData(prev => ({ ...prev, functional_severity: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="app_breaking">🔴 App-Breaking - Kompletter Crash</SelectItem>
                        <SelectItem value="feature_blocking">🟠 Feature-Blocking - Kern-Feature unbrauchbar</SelectItem>
                        <SelectItem value="workflow_impacting">🟡 Workflow-Impacting - Workflow unterbrochen</SelectItem>
                        <SelectItem value="minor_bug">🔵 Minor Bug - Kleiner Funktionsfehler</SelectItem>
                        <SelectItem value="cosmetic">⚪ Cosmetic - Tippfehler, falsche Farben</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Details (helfen bei Priorisierung)</Label>
                    {[
                      { key: 'causes_data_loss', label: '🚨 Verursacht Datenverlust' },
                      { key: 'breaks_core_workflow', label: '⛔ Bricht Haupt-Workflow' },
                      { key: 'affects_multiple_users', label: '👥 Betrifft mehrere User' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.functional_details[item.key]}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            functional_details: { ...prev.functional_details, [item.key]: checked }
                          }))}
                        />
                        <Label className="cursor-pointer">{item.label}</Label>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.functional_details.has_workaround}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          functional_details: { ...prev.functional_details, has_workaround: checked }
                        }))}
                      />
                      <Label className="cursor-pointer">✅ Workaround vorhanden</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Reproduzierbarkeit</Label>
                    <Select 
                      value={formData.functional_details.reproducible} 
                      onValueChange={(val) => setFormData(prev => ({
                        ...prev,
                        functional_details: { ...prev.functional_details, reproducible: val }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Immer</SelectItem>
                        <SelectItem value="sometimes">Manchmal</SelectItem>
                        <SelectItem value="once">Nur einmal</SelectItem>
                        <SelectItem value="intermittent">Sporadisch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {formData.problem_type === 'ux_issue' && (
                <>
                  <div>
                    <Label>UX Schweregrad *</Label>
                    <Select value={formData.ux_severity} onValueChange={(val) => setFormData(prev => ({ ...prev, ux_severity: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unusable">🔴 Unusable - Aufgabe unmöglich</SelectItem>
                        <SelectItem value="highly_confusing">🟠 Highly Confusing - Mehrere Versuche nötig</SelectItem>
                        <SelectItem value="moderately_confusing">🟡 Moderately Confusing - Kurze Orientierung nötig</SelectItem>
                        <SelectItem value="inconvenient">🔵 Inconvenient - Umständlich aber machbar</SelectItem>
                        <SelectItem value="polish_opportunity">⚪ Polish - Könnte intuitiver sein</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>UX-Details</Label>
                    {[
                      { key: 'prevents_task_completion', label: '⛔ Verhindert Aufgaben-Abschluss' },
                      { key: 'requires_external_help', label: '🆘 Benötigt externe Hilfe' },
                      { key: 'increases_task_time_significantly', label: '⏱️ Verlängert Aufgabe deutlich' },
                      { key: 'violates_ui_consistency', label: '🎨 Inkonsistent mit Rest der UI' },
                      { key: 'accessibility_issue', label: '♿ Barrierefreiheits-Problem' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.ux_details[item.key]}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            ux_details: { ...prev.ux_details, [item.key]: checked }
                          }))}
                        />
                        <Label className="cursor-pointer">{item.label}</Label>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div>
                <Label>Business-Bereich *</Label>
                <Select value={formData.business_area} onValueChange={(val) => setFormData(prev => ({ ...prev, business_area: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auth_login">🔐 Login/Auth (KRITISCH)</SelectItem>
                    <SelectItem value="finances">💰 Finanzen/Banking (KRITISCH)</SelectItem>
                    <SelectItem value="objects">🏢 Objekt-Verwaltung (KRITISCH)</SelectItem>
                    <SelectItem value="tenants">👥 Mieter-Verwaltung (KRITISCH)</SelectItem>
                    <SelectItem value="documents">📄 Dokumente (WICHTIG)</SelectItem>
                    <SelectItem value="taxes">📋 Steuern (WICHTIG)</SelectItem>
                    <SelectItem value="operating_costs">💸 Betriebskosten (WICHTIG)</SelectItem>
                    <SelectItem value="reports">📊 Reports (STANDARD)</SelectItem>
                    <SelectItem value="dashboard">📈 Dashboard (STANDARD)</SelectItem>
                    <SelectItem value="settings">⚙️ Einstellungen (NICE-TO-HAVE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Business-Impact *</Label>
                <Select value={formData.business_impact} onValueChange={(val) => setFormData(prev => ({ ...prev, business_impact: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue_blocking">💸 Revenue-Blocking - Verhindert Geld-Verdienen</SelectItem>
                    <SelectItem value="compliance_risk">⚖️ Compliance-Risk - Rechtliche Probleme</SelectItem>
                    <SelectItem value="user_retention_risk">👋 User-Retention-Risk - User könnten abwandern</SelectItem>
                    <SelectItem value="efficiency_impact">⏱️ Efficiency-Impact - Macht Arbeit langsamer</SelectItem>
                    <SelectItem value="nice_to_have">✨ Nice-to-Have - Verbesserung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Business-Details (optional, aber hilfreich)</Label>
                {[
                  { key: 'affects_billing', label: '💳 Betrifft Abrechnung' },
                  { key: 'affects_legal_compliance', label: '⚖️ Betrifft rechtliche Compliance' },
                  { key: 'affects_daily_workflow', label: '📅 Betrifft täglichen Workflow' },
                  { key: 'affects_onboarding', label: '🚀 Betrifft Onboarding neuer User' },
                  { key: 'affects_data_accuracy', label: '📊 Betrifft Daten-Genauigkeit' }
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.business_details[item.key]}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        business_details: { ...prev.business_details, [item.key]: checked }
                      }))}
                    />
                    <Label className="cursor-pointer">{item.label}</Label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div>
                <Label>User-Journey Stage *</Label>
                <Select value={formData.user_journey_stage} onValueChange={(val) => setFormData(prev => ({ ...prev, user_journey_stage: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_login">🎯 First Login - Erste Anmeldung</SelectItem>
                    <SelectItem value="onboarding">🚀 Onboarding - Einarbeitung</SelectItem>
                    <SelectItem value="daily_work">📅 Daily Work - Tägliche Workflows</SelectItem>
                    <SelectItem value="monthly_tasks">📆 Monthly Tasks - Monatliche Aufgaben</SelectItem>
                    <SelectItem value="yearly_tasks">📋 Yearly Tasks - Jährliche Aufgaben</SelectItem>
                    <SelectItem value="edge_case">🔍 Edge Case - Seltener Fall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Wie viele User sind betroffen? *</Label>
                <Select value={formData.affected_user_count_estimate} onValueChange={(val) => setFormData(prev => ({ ...prev, affected_user_count_estimate: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">👥👥👥 Alle User</SelectItem>
                    <SelectItem value="most_users">👥👥 Die meisten User (&gt;75%)</SelectItem>
                    <SelectItem value="some_users">👥 Einige User (25-75%)</SelectItem>
                    <SelectItem value="few_users">👤 Wenige User (&lt;25%)</SelectItem>
                    <SelectItem value="single_user">🙋 Nur ich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div>
                <Label>Erwartetes Verhalten</Label>
                <Textarea
                  value={formData.expected_behavior}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_behavior: e.target.value }))}
                  placeholder="Was sollte passieren?"
                  rows={2}
                />
              </div>

              <div>
                <Label>Tatsächliches Verhalten</Label>
                <Textarea
                  value={formData.actual_behavior}
                  onChange={(e) => setFormData(prev => ({ ...prev, actual_behavior: e.target.value }))}
                  placeholder="Was passiert stattdessen?"
                  rows={2}
                />
              </div>

              <div>
                <Label>Schritte zur Reproduktion</Label>
                <div className="space-y-2">
                  {formData.steps_to_reproduce.map((step, idx) => (
                    <Input
                      key={idx}
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      placeholder={`Schritt ${idx + 1}`}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddStep}>
                    + Schritt hinzufügen
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
          >
            {step > 1 ? 'Zurück' : 'Abbrechen'}
          </Button>

          {step < 5 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Problem melden & analysieren
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}