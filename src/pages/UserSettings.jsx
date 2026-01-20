import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Palette, Plug, Bell, Shield, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const settingSections = [
    {
        icon: User,
        title: 'Profil',
        description: 'Name, E-Mail und persönliche Informationen',
        page: 'SettingsProfile',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        icon: Palette,
        title: 'Darstellung',
        description: 'Theme, Farbmodus und Design-Einstellungen',
        page: 'SettingsAppearance',
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    {
        icon: Plug,
        title: 'Integrationen',
        description: 'Verbindungen zu anderen Tools',
        page: 'SettingsIntegrations',
        color: 'text-green-600',
        bg: 'bg-green-50'
    },
    {
        icon: Bell,
        title: 'Benachrichtigungen',
        description: 'E-Mail und Push-Benachrichtigungen',
        page: 'NotificationCenter',
        color: 'text-orange-600',
        bg: 'bg-orange-50'
    },
    {
        icon: Shield,
        title: 'Sicherheit',
        description: 'Passwort und Zugriffsrechte',
        page: 'UserSettings',
        color: 'text-red-600',
        bg: 'bg-red-50'
    },
    {
        icon: HelpCircle,
        title: 'Hilfe & Support',
        description: 'Dokumentation und Support',
        page: 'VermitifySupport',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
    }
];

export default function UserSettings() {
    return (
        <div className="max-w-4xl space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Einstellungen</h1>
                    <p className="vf-page-subtitle">Verwalten Sie Ihre Kontoeinstellungen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {settingSections.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                        <Link key={idx} to={createPageUrl(section.page)}>
                            <Card className="vf-card-clickable h-full">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-lg ${section.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-6 h-6 ${section.color}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-1">{section.title}</h3>
                                            <p className="text-sm text-gray-600">{section.description}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}