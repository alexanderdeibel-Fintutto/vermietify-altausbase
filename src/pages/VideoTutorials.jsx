import React from 'react';
import VideoTutorialCard from '@/components/help/VideoTutorialCard';
import { VfListPageHeader } from '@/components/list-pages/VfListPage';

export default function VideoTutorials() {
  const tutorials = [
    {
      title: 'Schnellstart - vermitify in 5 Minuten',
      duration: '5:23',
      description: 'Lernen Sie die Grundlagen von vermitify kennen'
    },
    {
      title: 'Objekt anlegen und Einheiten verwalten',
      duration: '8:45',
      description: 'Schritt-für-Schritt Anleitung'
    },
    {
      title: 'BK-Abrechnung erstellen',
      duration: '12:30',
      description: 'Automatische Betriebskostenabrechnung'
    },
    {
      title: 'Anlage V Export für ELSTER',
      duration: '6:15',
      description: 'Steuererklärung automatisch erstellen'
    },
    {
      title: 'Mietvertrag-Generator nutzen',
      duration: '7:50',
      description: 'Rechtssichere Mietverträge in Minuten'
    },
    {
      title: 'LetterXpress Integration einrichten',
      duration: '4:30',
      description: 'Automatischer Briefversand'
    }
  ];

  return (
    <div className="p-6">
      <VfListPageHeader
        title="Video-Tutorials"
        description="Schritt-für-Schritt Anleitungen"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <VideoTutorialCard key={tutorial.title} {...tutorial} />
        ))}
      </div>
    </div>
  );
}