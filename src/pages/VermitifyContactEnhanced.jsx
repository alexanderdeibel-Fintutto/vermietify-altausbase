import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function VermitifyContactEnhanced() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  return (
    <div className="min-h-screen bg-[var(--vf-neutral-50)]">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Kontakt</h1>
          <p className="text-xl text-[var(--vf-neutral-600)]">
            Haben Sie Fragen? Wir helfen Ihnen gerne weiter.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Schreiben Sie uns</h2>
            <div className="space-y-4">
              <VfInput
                label="Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <VfInput
                label="E-Mail"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <VfInput
                label="Betreff"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
              <VfTextarea
                label="Nachricht"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              <Button variant="gradient" size="lg" className="w-full">
                <Send className="h-5 w-5 mr-2" />
                Nachricht senden
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Weitere Kontaktmöglichkeiten</h2>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--vf-primary-100)] rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-[var(--vf-primary-600)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-Mail</h3>
                    <p className="text-[var(--vf-neutral-600)]">kontakt@vermitify.de</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--vf-success-100)] rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-[var(--vf-success-600)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefon</h3>
                    <p className="text-[var(--vf-neutral-600)]">+49 30 1234567</p>
                    <p className="text-sm text-[var(--vf-neutral-500)]">Mo-Fr, 9-17 Uhr</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--vf-accent-100)] rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-[var(--vf-accent-600)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Adresse</h3>
                    <p className="text-[var(--vf-neutral-600)]">
                      Vermitify GmbH<br />
                      Musterstraße 123<br />
                      10115 Berlin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}