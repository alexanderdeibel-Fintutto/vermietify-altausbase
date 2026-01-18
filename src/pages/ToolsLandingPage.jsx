import React from 'react';
import { Calculator, TrendingUp, FileText, PieChart, Home, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ToolsLandingPage() {
  const tools = [
    {
      icon: Calculator,
      title: 'Rendite-Rechner',
      description: 'Berechnen Sie die Brutto- und Nettorendite Ihrer Immobilie',
      link: '/rendite-rechner',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: TrendingUp,
      title: 'Indexmieten-Rechner',
      description: 'VPI-basierte Mietanpassungen automatisch berechnen',
      link: '/indexmieten-rechner-enhanced',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Percent,
      title: 'AfA-Rechner',
      description: 'Abschreibungen für Immobilien nach § 7 EStG berechnen',
      link: '/afa-calculator',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: PieChart,
      title: 'Cashflow-Rechner',
      description: 'Monatliche Einnahmen und Ausgaben kalkulieren',
      link: '/cashflow-rechner',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Home,
      title: 'Kaufpreis-Rechner',
      description: 'Maximalen Kaufpreis basierend auf Zielrendite ermitteln',
      link: '/kaufpreis-rechner',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: FileText,
      title: 'Mietvertrag-Generator',
      description: 'Rechtssichere Mietverträge in wenigen Minuten erstellen',
      link: '/mietvertrag-generator-enhanced',
      color: 'from-teal-500 to-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Kostenlose Tools für Vermieter</h1>
          <p className="text-xl text-[var(--vf-neutral-600)] max-w-3xl mx-auto">
            Professionelle Rechner und Generatoren – komplett kostenlos und ohne Registrierung
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <Link 
              key={index}
              to={tool.link}
              className="group block"
            >
              <div className="bg-white border border-[var(--vf-neutral-200)] rounded-2xl p-6 hover:shadow-xl transition-all">
                <div className={`w-14 h-14 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-[var(--theme-primary)] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-[var(--vf-neutral-600)]">
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-16 p-12 bg-gradient-to-br from-[var(--vf-primary-50)] to-[var(--vf-accent-50)] rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">Bereit für mehr?</h2>
          <p className="text-lg text-[var(--vf-neutral-600)] mb-8 max-w-2xl mx-auto">
            Mit Vermitify erhalten Sie Zugriff auf alle Tools plus automatische Dokumentengenerierung, 
            ELSTER-Integration, Mieter-Portal und vieles mehr.
          </p>
          <Button variant="gradient" size="lg">
            Jetzt kostenlos testen
          </Button>
        </div>
      </div>
    </div>
  );
}