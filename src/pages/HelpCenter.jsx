import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import FAQAccordion from '@/components/help/FAQAccordion';
import VideoTutorialCard from '@/components/help/VideoTutorialCard';
import { VfInput } from '@/components/shared/VfInput';
import { Search, Book, Video, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'Wie erstelle ich mein erstes Objekt?',
      answer: 'Gehen Sie zu "Objekte" und klicken Sie auf "Neues Objekt". Füllen Sie die Pflichtfelder aus und speichern Sie.'
    },
    {
      question: 'Wie funktioniert die BK-Abrechnung?',
      answer: 'Die BK-Abrechnung wird automatisch erstellt. Wählen Sie das Objekt, den Zeitraum und die Kostenpositionen - vermitify berechnet alles automatisch.'
    },
    {
      question: 'Kann ich meine Daten exportieren?',
      answer: 'Ja, Sie können Ihre Daten jederzeit als PDF, CSV oder Excel exportieren. Nutzen Sie die Export-Funktion in den jeweiligen Modulen.'
    },
    {
      question: 'Wie kündige ich mein Abonnement?',
      answer: 'Gehen Sie zu Einstellungen → Abonnement und klicken Sie auf "Kündigen". Ihre Daten bleiben bis zum Ende der Laufzeit erhalten.'
    }
  ];

  const tutorials = [
    { title: 'Schnellstart Tutorial', duration: '5:23' },
    { title: 'Objekte verwalten', duration: '8:45' },
    { title: 'BK-Abrechnung erstellen', duration: '12:30' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Hilfe & Support"
        subtitle="Finden Sie Antworten auf Ihre Fragen"
      />

      <div className="mb-8">
        <VfInput
          leftIcon={Search}
          placeholder="Wie können wir Ihnen helfen?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-2xl"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="vf-card p-6 text-center">
          <Book className="h-12 w-12 mx-auto mb-4 text-[var(--vf-primary-600)]" />
          <h3 className="font-semibold mb-2">Dokumentation</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Ausführliche Anleitungen
          </p>
          <Button variant="outline" className="w-full">Zur Dokumentation</Button>
        </div>

        <div className="vf-card p-6 text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-[var(--vf-accent-600)]" />
          <h3 className="font-semibold mb-2">Video-Tutorials</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Schritt-für-Schritt Videos
          </p>
          <Button variant="outline" className="w-full">Videos ansehen</Button>
        </div>

        <div className="vf-card p-6 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-[var(--vf-success-600)]" />
          <h3 className="font-semibold mb-2">Live-Chat</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Direkter Support-Chat
          </p>
          <Button variant="gradient" className="w-full">Chat starten</Button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Häufig gestellte Fragen</h2>
        <FAQAccordion faqs={faqs} />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Video-Tutorials</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {tutorials.map((tutorial) => (
            <VideoTutorialCard key={tutorial.title} {...tutorial} />
          ))}
        </div>
      </div>
    </div>
  );
}