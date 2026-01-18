import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { VfSelect } from '@/components/shared/VfSelect';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Mail, Phone, BookOpen, Send, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function VermitifySupport() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await base44.integrations.Core.SendEmail({
        to: 'support@vermitify.de',
        subject: `[Support] ${formData.subject}`,
        body: `
          Name: ${formData.name}
          Email: ${formData.email}
          Kategorie: ${formData.category}
          
          Nachricht:
          ${formData.message}
        `
      });
      
      setSubmitted(true);
      toast.success('Anfrage gesendet!');
    } catch (error) {
      toast.error('Fehler beim Senden');
    }
  };

  const supportChannels = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Sofortige Antworten während unserer Geschäftszeiten',
      action: 'Chat starten',
      available: true
    },
    {
      icon: Mail,
      title: 'E-Mail Support',
      description: 'support@vermitify.de - Antwort innerhalb von 24 Stunden',
      action: 'E-Mail schreiben',
      available: true
    },
    {
      icon: Phone,
      title: 'Telefon Support',
      description: '+49 30 1234 5678 - Mo-Fr 9-17 Uhr',
      action: 'Anrufen',
      available: true
    },
    {
      icon: BookOpen,
      title: 'Wissensdatenbank',
      description: 'Anleitungen, Videos und FAQs',
      action: 'Durchsuchen',
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 vf-gradient-text">Support Center</h1>
          <p className="text-lg text-[var(--theme-text-secondary)]">
            Wir sind für Sie da. Wie können wir helfen?
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportChannels.map((channel) => (
            <Card key={channel.title} className="vf-card-clickable">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--theme-primary-light)] rounded-full flex items-center justify-center">
                  <channel.icon className="h-8 w-8 text-[var(--theme-primary)]" />
                </div>
                <h3 className="font-semibold mb-2">{channel.title}</h3>
                <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
                  {channel.description}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  {channel.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Support-Anfrage senden</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-12">
                <Check className="h-16 w-16 text-[var(--vf-success-500)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Anfrage gesendet!</h3>
                <p className="text-[var(--theme-text-secondary)]">
                  Wir melden uns so schnell wie möglich bei Ihnen.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
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
                </div>

                <VfSelect
                  label="Kategorie"
                  required
                  value={formData.category}
                  onChange={(v) => setFormData({ ...formData, category: v })}
                  options={[
                    { value: 'general', label: 'Allgemeine Frage' },
                    { value: 'technical', label: 'Technisches Problem' },
                    { value: 'billing', label: 'Abrechnung' },
                    { value: 'feature', label: 'Feature-Wunsch' }
                  ]}
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
                  placeholder="Beschreiben Sie Ihr Anliegen..."
                />

                <Button variant="gradient" type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Anfrage senden
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}