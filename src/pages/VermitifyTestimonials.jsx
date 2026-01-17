import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { VfTestimonialsSection } from '@/components/marketing/VfTestimonialsSection';
import { Star } from 'lucide-react';

export default function VermitifyTestimonials() {
  const testimonials = [
    {
      quote: 'Die beste Investition für meine Immobilienverwaltung. vermitify spart mir jeden Monat 8 Stunden Arbeit.',
      author: 'Alexander Mustermann',
      role: 'Privater Vermieter, 4 Objekte',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rating: 5
    },
    {
      quote: 'Endlich eine Software, die speziell für deutsche Vermieter entwickelt wurde. Die Anlage V Funktion ist genial!',
      author: 'Sabine Klein',
      role: 'Hausverwaltung, 12 Objekte',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 5
    },
    {
      quote: 'Die BK-Abrechnungen erstelle ich jetzt in 20 Minuten statt 4 Stunden. Und meine Mieter verstehen sie endlich!',
      author: 'Thomas Weber',
      role: 'Gewerblicher Vermieter, 8 Objekte',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      rating: 5
    },
    {
      quote: 'Support antwortet innerhalb von 2 Stunden. Die Software ist intuitiv und macht einfach Spaß zu nutzen.',
      author: 'Julia Becker',
      role: 'Investorin, 3 Objekte',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      rating: 5
    },
    {
      quote: 'Als Steuerberater empfehle ich vermitify allen meinen Mandanten. Die ELSTER-Schnittstelle funktioniert perfekt.',
      author: 'Dr. Michael Schmidt',
      role: 'Steuerberater',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      rating: 5
    },
    {
      quote: 'Ich verwalte jetzt 6 Objekte problemlos alleine. Früher hätte ich dafür eine Hausverwaltung gebraucht.',
      author: 'Lisa Wagner',
      role: 'Professionelle Vermieterin, 6 Objekte',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
      rating: 5
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-6 w-6 fill-[var(--vf-warning-500)] text-[var(--vf-warning-500)]" />
            ))}
          </div>
          <h1 className="text-5xl font-bold mb-4">Was unsere Kunden sagen</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Über 2.500 zufriedene Vermieter nutzen vermitify
          </p>
        </div>

        <VfTestimonialsSection testimonials={testimonials} />

        <div className="mt-16 bg-[var(--vf-primary-50)] rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Überzeugen Sie sich selbst</h2>
          <p className="text-lg text-[var(--theme-text-secondary)] mb-6">
            Testen Sie vermitify 14 Tage kostenlos
          </p>
          <a href="/signup" className="vf-btn vf-btn-gradient vf-btn-lg">
            Jetzt kostenlos testen →
          </a>
        </div>
      </div>
    </VfMarketingLayout>
  );
}