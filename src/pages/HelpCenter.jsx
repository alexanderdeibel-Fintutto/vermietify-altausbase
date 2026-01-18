import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import FAQAccordion from '@/components/help/FAQAccordion';
import VideoTutorialCard from '@/components/help/VideoTutorialCard';
import { Button } from '@/components/ui/button';
import { MessageCircle, BookOpen, Video } from 'lucide-react';

export default function HelpCenter() {
  const tutorials = [
    { title: 'Erste Schritte', duration: '3:45', thumbnail: '' },
    { title: 'Objekte verwalten', duration: '5:20', thumbnail: '' },
    { title: 'Verträge erstellen', duration: '4:15', thumbnail: '' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Hilfe-Center"
        subtitle="Anleitungen und Unterstützung"
      />

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="text-center p-6">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-[var(--theme-primary)]" />
          <h3 className="font-semibold mb-2">Dokumentation</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Ausführliche Anleitungen
          </p>
          <Button variant="outline" size="sm">Öffnen</Button>
        </Card>

        <Card className="text-center p-6">
          <Video className="h-12 w-12 mx-auto mb-4 text-[var(--theme-primary)]" />
          <h3 className="font-semibold mb-2">Video-Tutorials</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Schritt-für-Schritt Videos
          </p>
          <Button variant="outline" size="sm">Ansehen</Button>
        </Card>

        <Card className="text-center p-6">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-[var(--theme-primary)]" />
          <h3 className="font-semibold mb-2">Live-Support</h3>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
            Direkter Chat-Support
          </p>
          <Button variant="gradient" size="sm">Chat starten</Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Beliebte Tutorials</h2>
          <div className="space-y-4">
            {tutorials.map((tutorial, index) => (
              <VideoTutorialCard key={index} {...tutorial} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Häufige Fragen</h2>
          <FAQAccordion />
        </div>
      </div>
    </div>
  );
}

function Card({ children, className = '' }) {
  return <div className={`bg-white border border-[var(--theme-border)] rounded-lg ${className}`}>{children}</div>;
}