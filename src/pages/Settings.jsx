import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Lock, Users, Palette, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="space-y-6">
            <div className="vf-page-header">
                <div>
                    <h1 className="vf-page-title">Einstellungen</h1>
                    <p className="vf-page-subtitle">Verwalte deine Kontoeinstellungen</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Allgemein</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Benachrichtigungen</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span className="hidden sm:inline">Sicherheit</span>
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Team</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        <span className="hidden sm:inline">Aussehen</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Profilinformation</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-600">Name</label>
                                    <input type="text" className="vf-input mt-1" defaultValue="Max Mustermann" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Email</label>
                                    <input type="email" className="vf-input mt-1" defaultValue="max@example.com" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Telefon</label>
                                    <input type="tel" className="vf-input mt-1" defaultValue="+49 123 456789" />
                                </div>
                                <Button className="vf-btn-primary">Speichern</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Benachrichtigungseinstellungen</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Neue Mieter', enabled: true },
                                    { label: 'Zahlungsreminder', enabled: true },
                                    { label: 'Wartungsanfragen', enabled: false },
                                    { label: 'Vertragsverlängerungen', enabled: true }
                                ].map((notif, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-semibold">{notif.label}</span>
                                        <input type="checkbox" defaultChecked={notif.enabled} className="w-4 h-4" />
                                    </div>
                                ))}
                            </div>
                            <Button className="vf-btn-primary mt-4">Speichern</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Sicherheitseinstellungen</h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="font-semibold text-sm mb-2">Passwort ändern</div>
                                    <Button variant="outline" className="w-full">Passwort aktualisieren</Button>
                                </div>
                                <div className="p-3 bg-gray-50 border rounded-lg">
                                    <div className="font-semibold text-sm mb-2">Zwei-Faktor-Authentifizierung</div>
                                    <div className="text-sm text-gray-600 mb-2">Erhöhe die Sicherheit deines Kontos</div>
                                    <Button variant="outline" className="w-full">2FA aktivieren</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Team-Mitglieder</h3>
                            <div className="space-y-2 mb-4">
                                {[
                                    { name: 'Anna Schmidt', role: 'Admin', email: 'anna@example.com' },
                                    { name: 'Bob Meyer', role: 'Manager', email: 'bob@example.com' }
                                ].map((member, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{member.name}</div>
                                            <div className="text-xs text-gray-600">{member.email}</div>
                                        </div>
                                        <Badge className="vf-badge-primary">{member.role}</Badge>
                                    </div>
                                ))}
                            </div>
                            <Button className="vf-btn-primary w-full">Team-Mitglied hinzufügen</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Design-Optionen</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-600 block mb-2">Farbschema</label>
                                    <div className="flex gap-2">
                                        <button className="w-12 h-12 rounded-lg bg-blue-600 border-2 border-blue-900" />
                                        <button className="w-12 h-12 rounded-lg bg-purple-600 border-2 border-gray-200" />
                                        <button className="w-12 h-12 rounded-lg bg-green-600 border-2 border-gray-200" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 block mb-2">Dunkelheit</label>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1">Hell</Button>
                                        <Button variant="outline" className="flex-1">Dunkel</Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}