import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const blogPosts = [
    {
        title: '10 Tipps für erfolgreiche Immobilienverwaltung',
        excerpt: 'Entdecken Sie bewährte Strategien, um Ihre Immobilien effizienter zu verwalten und Kosten zu sparen.',
        category: 'Verwaltung',
        author: 'Max Mustermann',
        date: '15.01.2024',
        readTime: '5 min'
    },
    {
        title: 'Betriebskostenabrechnung 2024: Das müssen Sie wissen',
        excerpt: 'Alle wichtigen Änderungen und Fristen für die Betriebskostenabrechnung im neuen Jahr.',
        category: 'Finanzen',
        author: 'Anna Schmidt',
        date: '10.01.2024',
        readTime: '8 min'
    },
    {
        title: 'Anlage V richtig ausfüllen - Schritt für Schritt',
        excerpt: 'Ein praktischer Leitfaden zur korrekten Erstellung der Anlage V für Vermieter.',
        category: 'Steuern',
        author: 'Thomas Berger',
        date: '05.01.2024',
        readTime: '10 min'
    },
    {
        title: 'Digitalisierung in der Hausverwaltung',
        excerpt: 'Wie moderne Software-Lösungen die Immobilienverwaltung revolutionieren.',
        category: 'Technologie',
        author: 'Lisa Huber',
        date: '28.12.2023',
        readTime: '6 min'
    },
    {
        title: 'Mieterhöhung rechtssicher durchführen',
        excerpt: 'Rechtliche Grundlagen und praktische Tipps für Mietanpassungen nach Kappungsgrenze.',
        category: 'Recht',
        author: 'Dr. Peter Wagner',
        date: '20.12.2023',
        readTime: '7 min'
    },
    {
        title: 'Energieausweis: Pflichten für Vermieter 2024',
        excerpt: 'Alle wichtigen Informationen zu Energieausweisen und gesetzlichen Anforderungen.',
        category: 'Compliance',
        author: 'Sarah Moser',
        date: '15.12.2023',
        readTime: '5 min'
    }
];

const categories = ['Alle', 'Verwaltung', 'Finanzen', 'Steuern', 'Recht', 'Technologie', 'Compliance'];

export default function VermitifyBlog() {
    const [selectedCategory, setSelectedCategory] = React.useState('Alle');

    const filteredPosts = selectedCategory === 'Alle' 
        ? blogPosts 
        : blogPosts.filter(post => post.category === selectedCategory);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Vermitify Blog
                    </h1>
                    <p className="text-xl text-gray-600">
                        Tipps, Neuigkeiten und Best Practices rund um Immobilienverwaltung
                    </p>
                </div>
            </div>

            {/* Categories */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="flex flex-wrap gap-3 justify-center">
                    {categories.map((cat, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full transition-all ${
                                selectedCategory === cat
                                    ? 'bg-gradient-to-r from-blue-900 to-orange-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Blog Posts */}
            <div className="max-w-6xl mx-auto px-6 pb-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map((post, idx) => (
                        <Card key={idx} className="vf-card-clickable">
                            <CardHeader>
                                <Badge className="vf-badge-primary w-fit mb-3">{post.category}</Badge>
                                <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm mb-4">{post.excerpt}</p>
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {post.date}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {post.author}
                                    </div>
                                    <span>{post.readTime}</span>
                                </div>

                                <Button variant="ghost" className="w-full">
                                    Weiterlesen
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}