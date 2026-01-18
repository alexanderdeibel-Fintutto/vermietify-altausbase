import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Users, Heart, TrendingUp, MapPin, Clock } from 'lucide-react';

export default function VermitifyCareer() {
  const positions = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Berlin / Remote',
      type: 'Vollzeit',
      description: 'Entwickle die nächste Generation unserer Immobilien-Management-Plattform mit React und TypeScript.'
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Berlin',
      type: 'Vollzeit',
      description: 'Gestalte die Produkt-Vision und arbeite eng mit Kunden und Entwicklern zusammen.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Vollzeit',
      description: 'Unterstütze unsere Kunden bei der optimalen Nutzung von Vermitify.'
    }
  ];

  const benefits = [
    { icon: Rocket, title: 'Wachstum', description: 'Entwickle dich mit uns weiter' },
    { icon: Users, title: 'Team', description: 'Arbeite mit den Besten' },
    { icon: Heart, title: 'Work-Life-Balance', description: 'Flexible Arbeitszeiten' },
    { icon: TrendingUp, title: 'Impact', description: 'Gestalte die PropTech-Zukunft' }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <div className="vf-hero vf-hero-gradient">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="vf-hero-headline">Werde Teil von Vermitify</h1>
          <p className="vf-hero-subheadline">
            Wir revolutionieren die Immobilienverwaltung. Komm an Bord und gestalte die Zukunft mit.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Warum Vermitify?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[var(--theme-primary-light)] rounded-full flex items-center justify-center">
                    <benefit.icon className="h-8 w-8 text-[var(--theme-primary)]" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[var(--theme-text-secondary)]">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-center mb-8">Offene Stellen</h2>
          <div className="space-y-6">
            {positions.map((position) => (
              <Card key={position.title}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                      <div className="flex gap-3 text-sm text-[var(--theme-text-secondary)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {position.type}
                        </span>
                      </div>
                    </div>
                    <Badge className="vf-badge-primary">{position.department}</Badge>
                  </div>
                  <p className="text-[var(--theme-text-secondary)] mb-4">
                    {position.description}
                  </p>
                  <Button variant="gradient">
                    Jetzt bewerben
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}