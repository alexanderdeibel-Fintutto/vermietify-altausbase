import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Phone, BookOpen } from 'lucide-react';

export default function SupportCenter() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Support"
        subtitle="Wir sind für Sie da"
      />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Live-Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              Sofortige Hilfe von unserem Support-Team
            </p>
            <Button variant="gradient" className="w-full">Chat starten</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              E-Mail Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              support@vermitify.de
            </p>
            <Button variant="outline" className="w-full">E-Mail senden</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Telefon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              +49 30 1234567 (Mo-Fr, 9-17 Uhr)
            </p>
            <Button variant="outline" className="w-full">Rückruf anfordern</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Wissensdatenbank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              Durchsuchen Sie unsere Artikel
            </p>
            <Button variant="outline" className="w-full">Zur Hilfe</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}