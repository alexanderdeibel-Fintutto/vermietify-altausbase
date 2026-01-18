import React from 'react';
import { Star, Quote } from 'lucide-react';

export default function VermitifyTestimonials() {
  const testimonials = [
    {
      name: 'Michael Schmidt',
      role: 'Vermieter, 8 Objekte',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      text: 'Vermitify hat mir hunderte Stunden gespart. Die automatische Betriebskostenabrechnung allein ist Gold wert.',
      rating: 5
    },
    {
      name: 'Sarah Müller',
      role: 'Hausverwaltung, 45 Einheiten',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      text: 'Die ELSTER-Integration funktioniert perfekt. Endlich kann ich meine Steuererklärung in unter einer Stunde erledigen.',
      rating: 5
    },
    {
      name: 'Thomas Becker',
      role: 'Investor, 15 Objekte',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      text: 'Das beste Tool für Immobilien-Investoren. Portfolio-Übersicht, Rendite-Tracking und Steueroptimierung in einer App.',
      rating: 5
    },
    {
      name: 'Julia Wagner',
      role: 'Privatvermieterin, 2 Wohnungen',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      text: 'Endlich verstehe ich meine Nebenkostenabrechnung. Die Vorlagen sind perfekt und rechtssicher.',
      rating: 5
    },
    {
      name: 'Robert Klein',
      role: 'Steuerberater',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      text: 'Ich empfehle Vermitify all meinen Mandanten. Die Datenqualität für die Steuererklärung ist hervorragend.',
      rating: 5
    },
    {
      name: 'Anna Hoffmann',
      role: 'Vermieterin, 4 Objekte',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      text: 'Das Mieter-Portal hat die Kommunikation revolutioniert. Keine nervigen Anrufe mehr wegen Kleinigkeiten.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Was unsere Kunden sagen</h1>
          <p className="text-xl text-[var(--vf-neutral-600)]">
            Über 1.000 zufriedene Vermieter vertrauen auf Vermitify
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white border border-[var(--vf-neutral-200)] rounded-2xl p-6 hover:shadow-lg transition-shadow relative"
            >
              <Quote className="h-10 w-10 text-[var(--vf-primary-200)] mb-4" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-[var(--vf-warning-400)] text-[var(--vf-warning-400)]" />
                ))}
              </div>

              <p className="text-[var(--vf-neutral-700)] mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-3">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-[var(--vf-neutral-500)]">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16 p-8 bg-gradient-to-br from-[var(--vf-primary-50)] to-[var(--vf-accent-50)] rounded-2xl">
          <h2 className="text-3xl font-bold mb-3">Werden Sie Teil der Vermitify-Community</h2>
          <p className="text-lg text-[var(--vf-neutral-600)] mb-6">
            Über 1.000 Vermieter nutzen bereits Vermitify
          </p>
          <Button variant="gradient" size="lg">
            Jetzt kostenlos starten
          </Button>
        </div>
      </div>
    </div>
  );
}