import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { 
    HelpCircle, 
    Search, 
    BookOpen, 
    Video, 
    MessageCircle, 
    FileText,
    Building2,
    Users,
    Euro
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const faqs = [
    {
        question: 'Wie erstelle ich ein neues Gebäude?',
        answer: 'Navigieren Sie zu "Gebäude" und klicken Sie auf "Gebäude hinzufügen". Geben Sie die Adresse und weitere Details ein.'
    },
    {
        question: 'Wie füge ich einen Mieter hinzu?',
        answer: 'Gehen Sie zu "Mieter" und klicken Sie auf "Mieter hinzufügen". Füllen Sie die Kontaktdaten aus.'
    },
    {
        question: 'Wie erstelle ich einen Mietvertrag?',
        answer: 'Unter "Verträge" können Sie einen neuen Vertrag erstellen, indem Sie Mieter und Wohneinheit verknüpfen.'
    },
    {
        question: 'Wie lade ich Dokumente hoch?',
        answer: 'Im Bereich "Dokumente" können Sie per Drag & Drop oder über den Upload-Button Dateien hochladen.'
    },
    {
        question: 'Wie erstelle ich eine Nebenkostenabrechnung?',
        answer: 'Nutzen Sie den BK-Abrechnungs-Wizard unter "Betriebskosten", der Sie Schritt für Schritt durch den Prozess führt.'
    }
];

const resources = [
    {
        icon: BookOpen,
        title: 'Dokumentation',
        description: 'Vollständige Anleitung zu allen Funktionen',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        icon: Video,
        title: 'Video-Tutorials',
        description: 'Schritt-für-Schritt Anleitungen als Video',
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    {
        icon: MessageCircle,
        title: 'Community Forum',
        description: 'Austausch mit anderen Vermietern',
        color: 'text-green-600',
        bg: 'bg-green-50'
    },
    {
        icon: HelpCircle,
        title: 'Support kontaktieren',
        description: 'Direkter Kontakt zu unserem Team',
        color: 'text-orange-600',
        bg: 'bg-orange-50'
    }
];

export default function HelpCenter() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl space-y-8">
            <div className="text-center py-8">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h1 className="text-4xl font-bold mb-3">Wie können wir helfen?</h1>
                <p className="text-xl text-gray-600">Finden Sie Antworten und lernen Sie Vermitify kennen</p>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-6">
                    <VfInput
                        leftIcon={Search}
                        placeholder="Suchen Sie nach Hilfe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* Resources */}
            <div className="grid md:grid-cols-2 gap-6">
                {resources.map((resource, idx) => {
                    const Icon = resource.icon;
                    return (
                        <Card key={idx} className="vf-card-clickable cursor-pointer">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg ${resource.bg} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${resource.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                                        <p className="text-sm text-gray-600">{resource.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* FAQs */}
            <Card>
                <CardHeader>
                    <CardTitle>Häufig gestellte Fragen</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible>
                        {filteredFaqs.map((faq, idx) => (
                            <AccordionItem key={idx} value={`item-${idx}`}>
                                <AccordionTrigger className="text-left">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-700">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="bg-gradient-to-br from-blue-900 to-orange-600 text-white border-none">
                <CardContent className="p-8 text-center">
                    <h3 className="text-2xl font-bold mb-2">Nicht gefunden, was Sie suchen?</h3>
                    <p className="mb-6 opacity-90">Unser Support-Team hilft Ihnen gerne weiter</p>
                    <Link to={createPageUrl('VermitifyContact')}>
                        <Button style={{ background: 'white', color: '#1E3A8A' }}>
                            Support kontaktieren
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}