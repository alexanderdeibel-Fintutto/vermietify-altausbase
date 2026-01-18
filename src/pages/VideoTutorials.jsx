import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import VideoTutorialInline from '@/components/help/VideoTutorialInline';

export default function VideoTutorials() {
  const tutorials = [
    { title: 'Erste Schritte mit Vermitify', duration: '3:45' },
    { title: 'Objekt anlegen', duration: '2:15' },
    { title: 'Mieter verwalten', duration: '4:20' },
    { title: 'Verträge erstellen', duration: '5:10' },
    { title: 'Betriebskosten abrechnen', duration: '6:30' },
    { title: 'Finanzberichte erstellen', duration: '3:50' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Video-Tutorials"
        subtitle="Schritt-für-Schritt Anleitungen"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {tutorials.map((tutorial, index) => (
          <VideoTutorialInline
            key={index}
            title={tutorial.title}
            duration={tutorial.duration}
          />
        ))}
      </div>
    </div>
  );
}