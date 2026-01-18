import React from 'react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VermitifyBlog() {
  const posts = [
    {
      title: 'Betriebskostenabrechnung 2025: Das müssen Sie beachten',
      excerpt: 'Neue Regelungen und wichtige Fristen für die BK-Abrechnung 2025. Ein Leitfaden für Vermieter.',
      date: '2025-01-15',
      author: 'Sarah Müller',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop',
      category: 'Recht'
    },
    {
      title: '5 Tipps zur Steueroptimierung bei Vermietung',
      excerpt: 'So holen Sie das Maximum aus Ihrer Steuererklärung heraus. Von AfA bis Werbungskosten.',
      date: '2025-01-10',
      author: 'Dr. Thomas Klein',
      image: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&h=400&fit=crop',
      category: 'Steuern'
    },
    {
      title: 'Indexmiete: Wann und wie Sie die Miete anpassen können',
      excerpt: 'Alles zur VPI-Indexanpassung: Rechtliche Grundlagen, Berechnung und Umsetzung.',
      date: '2025-01-05',
      author: 'Michael Schmidt',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
      category: 'Verwaltung'
    },
    {
      title: 'Digitalisierung in der Immobilienverwaltung',
      excerpt: 'Warum digitale Tools die Zukunft sind und wie Sie den Einstieg schaffen.',
      date: '2025-01-01',
      author: 'Anna Hoffmann',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      category: 'Digital'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-[var(--vf-neutral-600)]">
            Wissen, Tipps und News rund um Immobilienverwaltung
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {posts.map((post, index) => (
            <article 
              key={index}
              className="bg-white border border-[var(--vf-neutral-200)] rounded-2xl overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <div className="overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="vf-badge vf-badge-gradient text-xs">{post.category}</span>
                  <div className="flex items-center gap-1 text-xs text-[var(--vf-neutral-500)]">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-3 group-hover:text-[var(--theme-primary)] transition-colors">
                  {post.title}
                </h2>
                <p className="text-[var(--vf-neutral-600)] mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-[var(--vf-neutral-400)]" />
                    <span className="text-[var(--vf-neutral-600)]">{post.author}</span>
                  </div>
                  <Button variant="link" className="text-[var(--theme-primary)] p-0">
                    Weiterlesen
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}