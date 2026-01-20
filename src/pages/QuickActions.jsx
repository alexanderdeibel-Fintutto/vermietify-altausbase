import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Building2, 
    Users, 
    FileText, 
    Euro, 
    Home, 
    Wrench,
    Calendar,
    MessageSquare 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const actions = [
    { icon: Building2, title: 'Gebäude hinzufügen', page: 'Buildings', color: 'from-blue-600 to-blue-800' },
    { icon: Users, title: 'Mieter hinzufügen', page: 'Tenants', color: 'from-green-600 to-green-800' },
    { icon: FileText, title: 'Vertrag erstellen', page: 'Contracts', color: 'from-purple-600 to-purple-800' },
    { icon: Euro, title: 'Rechnung erfassen', page: 'Invoices', color: 'from-red-600 to-red-800' },
    { icon: Home, title: 'Einheit hinzufügen', page: 'UnitsManagement', color: 'from-indigo-600 to-indigo-800' },
    { icon: Wrench, title: 'Wartung planen', page: 'MaintenanceManager', color: 'from-orange-600 to-orange-800' },
    { icon: Calendar, title: 'Aufgabe erstellen', page: 'Tasks', color: 'from-cyan-600 to-cyan-800' },
    { icon: MessageSquare, title: 'Nachricht senden', page: 'CommunicationCenter', color: 'from-pink-600 to-pink-800' }
];

export default function QuickActions() {
    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Schnellaktionen</h1>
                    <p className="vf-page-subtitle">Häufige Aufgaben mit einem Klick</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {actions.map((action, idx) => {
                    const Icon = action.icon;
                    return (
                        <Link key={idx} to={createPageUrl(action.page)}>
                            <Card className="vf-card-clickable h-full">
                                <CardContent className="p-6 text-center">
                                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center text-white`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-semibold">{action.title}</h3>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}