import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VermitifyBlog() {
  const posts = [
    {
      id: 1,
      title: 'Anlage V 2025: Das müssen Vermieter wissen',
      excerpt: 'Alle wichtigen Änderungen und Tipps für die Steuererklärung 2025',
      author: 'Sarah Schmidt',
      date: '15. Januar 2026',
      category: 'Steuern',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400'
    },
    {
      id: 2,
      title: 'Indexmiete richtig berechnen',
      excerpt: 'So nutzen Sie die VPI-Entwicklung für legale Mieterhöhungen',
      author: 'Thomas Weber',
      date: '10. Januar 2026',
      category: 'Vermietung',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
    },
    {
      id: 3,
      title: 'Betriebskosten 2025: Diese Kosten sind umlagefähig',
      excerpt: 'Vollständige Übersicht gemäß Betriebskostenverordnung',
      author: 'Julia Becker',
      date: '5. Januar 2026',
      category: 'Betriebskosten',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400'
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Blog & Ratgeber</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Wissen für erfolgreiche Vermieter
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="vf-card-clickable">
              <div className="aspect-video overflow-hidden rounded-t-lg">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="vf-badge vf-badge-primary mb-3">{post.category}</div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--theme-text-secondary)] mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-[var(--theme-text-muted)]">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </VfMarketingLayout>
  );
}