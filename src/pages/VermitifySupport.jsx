import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Mail, MessageCircle, BookOpen, Video, HelpCircle, Phone } from 'lucide-react';

const supportOptions = [
    {
        icon: Mail,
        title: 'E-Mail Support',
        description: 'Senden Sie uns Ihre Frage per E-Mail',
        action: 'support@vermitify.com',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        icon: MessageCircle,
        title: 'Live Chat',
        description: 'Chatten Sie direkt mit unserem Team',
        action: 'Chat starten',
        color: 'text-green-600',
        bg: 'bg-green-50'
    },
    {
        icon: BookOpen,
        title: 'Wissensdatenbank',
        description: 'Durchsuchen Sie unsere Hilfeartikel',
        action: 'Zur Wissensdatenbank',
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    {
        icon: Video,
        title: 'Video-Tutorials',
        description: 'Lernen Sie mit unseren Schritt-für-Schritt Videos',
        action: 'Videos ansehen',
        color: 'text-orange-600',
        bg: 'bg-orange-50'
    },
    {
        icon: HelpCircle,
        title: 'FAQ',
        description: 'Antworten auf häufig gestellte Fragen',
        action: 'FAQ öffnen',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        link: 'VermitifyFAQ'
    },
    {
        icon: Phone,
        title: 'Telefon Support',
        description: 'Für Enterprise-Kunden verfügbar',
        action: '+43 1 234 5678',
        color: 'text-red-600',
        bg: 'bg-red-50'
    }
];

export default function VermitifySupport() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Wir sind für Sie da
                    </h1>
                    <p className="text-xl text-gray-600">
                        Schnelle Hilfe, wann immer Sie sie brauchen
                    </p>
                </div>
            </div>

            {/* Support Options */}
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {supportOptions.map((option, idx) => {
                        const Icon = option.icon;
                        const content = (
                            <Card className="vf-card-clickable h-full">
                                <CardContent className="p-6">
                                    <div className={`w-14 h-14 rounded-xl ${option.bg} flex items-center justify-center mb-4`}>
                                        <Icon className={`w-7 h-7 ${option.color}`} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">{option.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                                    <Button variant="outline" className="w-full">
                                        {option.action}
                                    </Button>
                                </CardContent>
                            </Card>
                        );

                        return option.link ? (
                            <Link key={idx} to={createPageUrl(option.link)}>
                                {content}
                            </Link>
                        ) : (
                            <div key={idx}>{content}</div>
                        );
                    })}
                </div>
            </div>

            {/* Response Times */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Unsere Support-Zeiten</h2>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center">Starter</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-gray-600 mb-2">E-Mail Support</p>
                                <p className="text-2xl font-bold mb-1">24h</p>
                                <p className="text-xs text-gray-500">Antwortzeit</p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-blue-600">
                            <CardHeader>
                                <CardTitle className="text-center">Professional</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-gray-600 mb-2">Prioritäts-Support</p>
                                <p className="text-2xl font-bold mb-1">8h</p>
                                <p className="text-xs text-gray-500">Antwortzeit</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-center">Enterprise</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                                <p className="text-sm text-gray-600 mb-2">Persönlicher Support</p>
                                <p className="text-2xl font-bold mb-1">2h</p>
                                <p className="text-xs text-gray-500">Antwortzeit</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Contact CTA */}
            <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold mb-6">Noch Fragen?</h2>
                <p className="text-xl text-gray-600 mb-8">
                    Unser Team ist gerne für Sie da
                </p>
                <Link to={createPageUrl('VermitifyContactEnhanced')}>
                    <Button className="vf-btn-gradient vf-btn-lg">
                        Kontakt aufnehmen
                    </Button>
                </Link>
            </div>
        </div>
    );
}