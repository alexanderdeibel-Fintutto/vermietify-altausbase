import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import VideoTutorialCard from '@/components/help/VideoTutorialCard';

export default function VideoTutorials() {
  const tutorials = [
    { id: 1, title: 'Erste Schritte mit Vermitify', duration: '8 Min.' },
    { id: 2, title: 'Objekt anlegen', duration: '5 Min.' },
    { id: 3, title: 'Mietvertrag erstellen', duration: '10 Min.' },
    { id: 4, title: 'Betriebskostenabrechnung', duration: '15 Min.' },
    { id: 5, title: 'Steuer-Features nutzen', duration: '12 Min.' },
    { id: 6, title: 'Berichte erstellen', duration: '7 Min.' }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Video-Tutorials"
        subtitle="Lernen Sie Vermitify Schritt für Schritt kennen"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {tutorials.map((tutorial) => (
          <VideoTutorialCard key={tutorial.id} {...tutorial} />
        ))}
      </div>
    </div>
  );
}