import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Bell, Lock, Palette, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = React.useState('general');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Einstellungen</h1>
                    <p className="vf-page-subtitle">Verwalte dein Konto & Präferenzen</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                {[
                    { icon: SettingsIcon, label: 'Allgemein', id: 'general' },
                    { icon: Bell, label: 'Benachrichtigungen', id: 'notifications' },
                    { icon: Palette, label: 'Erscheinungsbild', id: 'appearance' },
                    { icon: Lock, label: 'Sicherheit', id: 'security' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                            activeTab === tab.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <tab.icon className="w-6 h-6 mb-2 mx-auto" />
                        <div className="text-sm font-semibold">{tab.label}</div>
                    </button>
                ))}
            </div>

            <Card>
                <CardContent className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Allgemeine Einstellungen</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Firmenname</label>
                                    <Input placeholder="Dein Firmenname" className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">E-Mail</label>
                                    <Input placeholder="email@example.com" className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Telefon</label>
                                    <Input placeholder="+49 1234567890" className="mt-1" />
                                </div>
                                <div className="pt-4">
                                    <Button className="bg-blue-600 hover:bg-blue-700">Speichern</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Benachrichtigungen</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-semibold">Zahlungserinnerungen</div>
                                        <div className="text-sm text-gray-600">Erhalte Benachrichtigungen bei ausstehenden Zahlungen</div>
                                    </div>
                                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-semibold">Wartungsmitteilungen</div>
                                        <div className="text-sm text-gray-600">Benachrichtigungen bei Wartungsaufträgen</div>
                                    </div>
                                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-semibold">Dokumentupdates</div>
                                        <div className="text-sm text-gray-600">Informationen über neue Dokumente</div>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Erscheinungsbild</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600">Farbschema</label>
                                    <div className="flex gap-2 mt-2">
                                        {['Blau', 'Grün', 'Orange', 'Violett'].map((color) => (
                                            <button
                                                key={color}
                                                className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300"
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-semibold">Dunkler Modus</div>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Sicherheit</h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Passwort ändern
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Zwei-Faktor-Authentifizierung aktivieren
                                </Button>
                                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <h4 className="font-semibold text-red-700 mb-2">Gefahrenzone</h4>
                                    <Button variant="destructive" className="w-full">
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Konto löschen
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}