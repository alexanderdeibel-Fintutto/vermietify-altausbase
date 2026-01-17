import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search, Book, Video, MessageSquare, FileText } from 'lucide-react';

export default function VermitifyHelp() {
  const [search, setSearch] = useState('');

  const categories = [
    {
      title: 'Erste Schritte',
      icon: Book,
      articles: [
        'Wie lege ich mein erstes Objekt an?',
        'Mieter erfassen und Vertrag erstellen',
        'Dokumente hochladen und verwalten'
      ]
    },
    {
      title: 'Betriebskosten',
      icon: FileText,
      articles: [
        'BK-Abrechnung erstellen',
        'Verteilerschlüssel richtig wählen',
        'Umlagefähige Kosten gemäß BetrKV'
      ]
    },
    {
      title: 'Steuern',
      icon: FileText,
      articles: [
        'Anlage V automatisch erstellen',
        'AfA korrekt berechnen',
        'ELSTER-Export durchführen'
      ]
    },
    {
      title: 'Video-Tutorials',
      icon: Video,
      articles: [
        'Schnellstart-Video (5 Min)',
        'BK-Abrechnung Schritt-für-Schritt',
        'Anlage V Export Tutorial'
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Hilfe & Support</h1>
        <p className="text-xl text-[var(--theme-text-secondary)] mb-8">
          Finden Sie Antworten auf Ihre Fragen
        </p>
        
        <div className="max-w-2xl mx-auto">
          <VfInput
            leftIcon={Search}
            placeholder="Suchen Sie nach Hilfe-Artikeln..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--vf-primary-100)] flex items-center justify-center">
                    <CategoryIcon className="h-5 w-5 text-[var(--vf-primary-600)]" />
                  </div>
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.articles.map((article, index) => (
                    <li key={index}>
                      <a 
                        href="#" 
                        className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] transition-colors"
                      >
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-[var(--vf-primary-50)] rounded-xl p-8 text-center">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[var(--vf-primary-600)]" />
        <h2 className="text-2xl font-bold mb-2">Nichts gefunden?</h2>
        <p className="text-[var(--theme-text-secondary)] mb-4">
          Unser Support-Team hilft Ihnen gerne weiter
        </p>
        <div className="flex gap-3 justify-center">
          <a href="mailto:support@vermitify.de" className="vf-btn vf-btn-primary vf-btn-md">
            E-Mail schreiben
          </a>
          <a href="tel:+493012345678" className="vf-btn vf-btn-outline vf-btn-md">
            Anrufen
          </a>
        </div>
      </div>
    </div>
  );
}