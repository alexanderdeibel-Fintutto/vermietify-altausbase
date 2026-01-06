import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LetterXpressSettings from '../components/letterxpress/LetterXpressSettings';
import PostausgangsbuchTable from '../components/letterxpress/PostausgangsbuchTable';

export default function Kommunikation() {
    const [activeTab, setActiveTab] = useState('postversand');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Kommunikation</h1>
                <p className="text-slate-600 mt-2">Verwalten Sie Ihre gesamte Kommunikation mit Mietern und Partnern</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="postversand" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Postversand
                    </TabsTrigger>
                    <TabsTrigger value="emails" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-Mails
                    </TabsTrigger>
                    <TabsTrigger value="nachrichten" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Nachrichten
                    </TabsTrigger>
                    <TabsTrigger value="versand" className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Versand
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="postversand" className="space-y-6 mt-6">
                    <Tabs defaultValue="ausgangsbuch">
                        <TabsList>
                            <TabsTrigger value="ausgangsbuch">Postausgangsbuch</TabsTrigger>
                            <TabsTrigger value="einstellungen">Einstellungen</TabsTrigger>
                        </TabsList>

                        <TabsContent value="ausgangsbuch" className="mt-6">
                            <PostausgangsbuchTable />
                        </TabsContent>

                        <TabsContent value="einstellungen" className="mt-6">
                            <LetterXpressSettings />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="emails" className="mt-6">
                    <div className="text-center py-12 text-slate-500">
                        <Mail className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>E-Mail-Integration folgt in Kürze</p>
                    </div>
                </TabsContent>

                <TabsContent value="nachrichten" className="mt-6">
                    <div className="text-center py-12 text-slate-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Nachrichten-Feature folgt in Kürze</p>
                    </div>
                </TabsContent>

                <TabsContent value="versand" className="mt-6">
                    <div className="text-center py-12 text-slate-500">
                        <Send className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Versand-Feature folgt in Kürze</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}