import React from 'react';
import { Target, Users, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VermitifyAboutUs() {
  const values = [
    {
      icon: Target,
      title: 'Mission',
      description: 'Wir digitalisieren die Immobilienverwaltung und machen sie einfach, transparent und effizient.'
    },
    {
      icon: Users,
      title: 'Team',
      description: 'Ein Team aus Immobilien-Experten, Steuerberatern und Software-Entwicklern.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Wir nutzen neueste KI-Technologie, um Prozesse zu automatisieren und Zeit zu sparen.'
    },
    {
      icon: Shield,
      title: 'Vertrauen',
      description: 'DSGVO-konform, sicher und transparent. Ihre Daten sind bei uns in besten Händen.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Über Vermitify</h1>
          <p className="text-xl text-[var(--vf-neutral-600)] max-w-3xl mx-auto">
            Wir haben Vermitify gegründet, weil wir selbst frustriert waren von komplizierter Software 
            und ineffizienten Prozessen in der Immobilienverwaltung.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop"
              alt="Team"
              className="rounded-2xl shadow-lg w-full"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Unsere Geschichte</h2>
            <p className="text-[var(--vf-neutral-700)] mb-4">
              Gegründet 2024 in Berlin, haben wir es uns zur Aufgabe gemacht, die Immobilienverwaltung 
              zu revolutionieren. Was als kleines Tool für die eigene Vermietung begann, ist heute eine 
              vollumfängliche Plattform für professionelle Vermieter und Hausverwaltungen.
            </p>
            <p className="text-[var(--vf-neutral-700)]">
              Heute vertrauen über 1.000 Vermieter in Deutschland, Österreich und der Schweiz auf Vermitify.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {values.map((value, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <value.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
              <p className="text-[var(--vf-neutral-600)]">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center p-12 bg-gradient-to-br from-[var(--vf-primary-50)] to-[var(--vf-accent-50)] rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Werden Sie Teil unserer Mission</h2>
          <p className="text-lg text-[var(--vf-neutral-600)] mb-8 max-w-2xl mx-auto">
            Wir suchen talentierte Menschen, die mit uns die Immobilienverwaltung neu erfinden wollen.
          </p>
          <Button variant="gradient" size="lg">
            Karriere bei Vermitify
          </Button>
        </div>
      </div>
    </div>
  );
}