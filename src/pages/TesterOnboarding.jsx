import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TestTube, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function TesterOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    specializations: [],
    tester_level: 'beginner'
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('token');
    if (inviteToken) {
      setToken(inviteToken);
      loadInvitation(inviteToken);
    }
  }, []);

  const loadInvitation = async (token) => {
    try {
      const invitations = await base44.asServiceRole.entities.TesterInvitation.filter({ 
        invitation_token: token,
        status: 'pending'
      });

      if (invitations.length === 0) {
        toast.error('Ungültige oder abgelaufene Einladung');
        return;
      }

      const invite = invitations[0];
      
      if (new Date(invite.expires_at) < new Date()) {
        toast.error('Diese Einladung ist abgelaufen');
        await base44.asServiceRole.entities.TesterInvitation.update(invite.id, { status: 'expired' });
        return;
      }

      setInvitation(invite);
      setStep(2);
    } catch (error) {
      console.error('Error loading invitation:', error);
      toast.error('Fehler beim Laden der Einladung');
    }
  };

  const completeMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      await base44.asServiceRole.auth.updateMe({
        is_tester: true,
        tester_specialization: formData.specializations,
        tester_level: formData.tester_level,
        tester_onboarded_at: new Date().toISOString()
      });

      await base44.asServiceRole.entities.TesterInvitation.update(invitation.id, {
        status: 'accepted',
        used_at: new Date().toISOString()
      });

      return user;
    },
    onSuccess: () => {
      toast.success('Willkommen im Testing-Team! 🎉');
      navigate(createPageUrl('TestingDashboard'));
    }
  });

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-6 h-6 text-emerald-600" />
                Tester Onboarding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Du wurdest als Tester eingeladen. Bitte melde dich zuerst an oder registriere dich.
              </p>
              <Button
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Anmelden / Registrieren
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (step === 2 && invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-600" />
                Willkommen im Testing-Team!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {invitation.welcome_message && (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-900">{invitation.welcome_message}</p>
                </div>
              )}

              <div>
                <Label className="text-base">Was möchtest du hauptsächlich testen?</Label>
                <p className="text-sm text-slate-600 mb-3">Mehrfachauswahl möglich</p>
                <div className="space-y-2">
                  {[
                    { value: 'functionality', label: '🔧 Funktionalität - Bugs finden' },
                    { value: 'usability', label: '🎨 Usability - UX verbessern' },
                    { value: 'performance', label: '⚡ Performance - Geschwindigkeit' },
                    { value: 'regression', label: '🔄 Regression - Alte Features' },
                    { value: 'onboarding', label: '🚀 Onboarding - Neue User Experience' }
                  ].map(spec => (
                    <div key={spec.value} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.specializations.includes(spec.value)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            specializations: checked
                              ? [...prev.specializations, spec.value]
                              : prev.specializations.filter(s => s !== spec.value)
                          }));
                        }}
                      />
                      <Label className="cursor-pointer">{spec.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base">Deine Testing-Erfahrung</Label>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { value: 'beginner', label: '🌱 Anfänger', desc: 'Erste Erfahrungen' },
                    { value: 'intermediate', label: '🌿 Fortgeschritten', desc: 'Einige Erfahrung' },
                    { value: 'expert', label: '🌳 Experte', desc: 'Professionell' }
                  ].map(level => (
                    <Card
                      key={level.value}
                      className={`cursor-pointer transition-all ${
                        formData.tester_level === level.value
                          ? 'border-2 border-emerald-600 bg-emerald-50'
                          : 'border hover:border-emerald-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, tester_level: level.value }))}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-1">{level.label.split(' ')[0]}</div>
                        <div className="text-sm font-medium">{level.label.split(' ')[1]}</div>
                        <div className="text-xs text-slate-600 mt-1">{level.desc}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => completeMutation.mutate()}
                  disabled={formData.specializations.length === 0 || completeMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Onboarding abschließen
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
}