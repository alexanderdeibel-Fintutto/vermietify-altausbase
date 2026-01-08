import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronRight, BookOpen, MessageCircle, Video } from 'lucide-react';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faq = [
    {
      category: 'Mieter-Management',
      items: [
        { q: 'Wie füge ich einen neuen Mieter hinzu?', a: 'Gehen Sie zu Mieter > Neuer Mieter und füllen Sie das Formular aus.' },
        { q: 'Wie erstelle ich einen Mietvertrag?', a: 'Nutzen Sie den integrierten Dokumentgenerator unter Dokumenten > Neue Vorlage.' },
      ]
    },
    {
      category: 'Finanzen',
      items: [
        { q: 'Wie wird die Nebenkostenabrechnung erstellt?', a: 'Unter Nebenkosten > Abrechnung erstellen können Sie automatisiert abrechnen.' },
        { q: 'Welche Berichte sind verfügbar?', a: 'Sie finden alle Reports unter Reports > Vorhandene Reports.' },
      ]
    },
    {
      category: 'Wartung',
      items: [
        { q: 'Wie erstelle ich ein Wartungsticket?', a: 'Klicken Sie auf Wartung > Neues Ticket und füllen Sie die Details aus.' },
        { q: 'Wer kann Wartungsanfragen stellen?', a: 'Mieter können über das Selbstservice-Portal Anfragen stellen.' },
      ]
    },
  ];

  const tutorials = [
    { title: 'Getting Started - 5 Minuten', duration: '5:30' },
    { title: 'Dashboard Übersicht', duration: '3:15' },
    { title: 'Mieterverwaltung von A-Z', duration: '12:45' },
    { title: 'Reports & Analysen', duration: '8:20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">❓ Help Center</h1>
        <p className="text-slate-600 mt-1">Dokumentation, FAQs und Video-Tutorials</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Haben Sie eine Frage? Hier können Sie suchen..." 
          className="pl-10 h-12"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="faq">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq" className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> FAQs</TabsTrigger>
          <TabsTrigger value="tutorials" className="flex items-center gap-2"><Video className="w-4 h-4" /> Tutorials</TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Support</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          {faq.map((category, idx) => (
            <div key={idx}>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((item, itemIdx) => (
                  <Card key={itemIdx} className="border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{item.q}</p>
                          <p className="text-sm text-slate-600 mt-2">{item.a}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="tutorials" className="space-y-3">
          {tutorials.map((tutorial, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Video className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{tutorial.title}</p>
                    <p className="text-xs text-slate-600">{tutorial.duration}</p>
                  </div>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">Schauen</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="support">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Kontaktieren Sie uns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Betreff</label>
                <Input placeholder="Wie können wir helfen?" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Nachricht</label>
                <textarea placeholder="Beschreiben Sie Ihr Problem..." rows="6" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></textarea>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Support-Anfrage senden</Button>
              <p className="text-xs text-slate-600 text-center">Wir antworten innerhalb von 24 Stunden</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}