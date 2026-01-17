import React, { useState } from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { VfInput } from '@/components/shared/VfInput';
import { VfButton } from '@/components/shared/VfButton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function VermitifyContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const sendMutation = useMutation({
    mutationFn: async (data) => {
      await base44.functions.invoke('captureLead', {
        email: data.email,
        name: data.name,
        phone: data.phone,
        source: 'website',
        source_detail: 'contact_form'
      });
      
      await base44.integrations.Core.SendEmail({
        to: 'support@vermitify.de',
        subject: `Kontaktanfrage von ${data.name}`,
        body: `Name: ${data.name}\nE-Mail: ${data.email}\nTelefon: ${data.phone}\n\nNachricht:\n${data.message}`,
        from_name: 'vermitify Website'
      });
    },
    onSuccess: () => {
      setFormData({ name: '', email: '', phone: '', message: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMutation.mutate(formData);
  };

  return (
    <VfMarketingLayout>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Kontakt</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Wir freuen uns auf Ihre Nachricht
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Nachricht senden</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <VfInput
                    label="Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Max Mustermann"
                  />
                  
                  <VfInput
                    label="E-Mail"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="max@example.com"
                  />
                  
                  <VfInput
                    label="Telefon"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+49 170 1234567"
                  />
                  
                  <div>
                    <label className="vf-label vf-label-required">Nachricht</label>
                    <Textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Wie können wir Ihnen helfen?"
                      className="min-h-32"
                    />
                  </div>

                  <VfButton 
                    type="submit" 
                    variant="gradient"
                    fullWidth
                    icon={Send}
                    loading={sendMutation.isPending}
                  >
                    {sendMutation.isPending ? 'Wird gesendet...' : 'Nachricht senden'}
                  </VfButton>

                  {sendMutation.isSuccess && (
                    <div className="vf-alert vf-alert-success">
                      <div className="vf-alert-title">Gesendet!</div>
                      <div className="vf-alert-description">
                        Vielen Dank für Ihre Nachricht. Wir melden uns innerhalb von 24 Stunden.
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--vf-primary-100)] flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-[var(--vf-primary-600)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-Mail</h3>
                    <p className="text-[var(--theme-text-secondary)]">support@vermitify.de</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--vf-primary-100)] flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-[var(--vf-primary-600)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefon</h3>
                    <p className="text-[var(--theme-text-secondary)]">+49 30 1234 5678</p>
                    <p className="text-sm text-[var(--theme-text-muted)]">Mo-Fr, 9-18 Uhr</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--vf-primary-100)] flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-[var(--vf-primary-600)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Adresse</h3>
                    <p className="text-[var(--theme-text-secondary)]">
                      vermitify GmbH<br />
                      Musterstraße 1<br />
                      10115 Berlin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </VfMarketingLayout>
  );
}