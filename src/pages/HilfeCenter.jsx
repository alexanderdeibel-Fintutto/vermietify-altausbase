import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, BookOpen, AlertCircle, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HilfeCenterPage() {
  const [search, setSearch] = useState('');

  const articles = [
    { id: 1, title: 'Wie erstelle ich ein neues Gebäude?', category: 'Gebäude', views: 1240 },
    { id: 2, title: 'Mieterarbeitsablauf einrichten', category: 'Mieter', views: 987 },
    { id: 3, title: 'Finanzberichte verstehen', category: 'Finanzen', views: 654 },
    { id: 4, title: 'ELSTER Integration konfigurieren', category: 'Steuern', views: 432 },
    { id: 5, title: 'Zahlungen automatisieren', category: 'Zahlungen', views: 876 },
  ];

  const faqs = [
    { q: 'Wie ändere ich mein Passwort?', a: 'Gehen Sie zu Einstellungen > Sicherheit und klicken Sie auf "Passwort ändern".' },
    { q: 'Kann ich mehrere Gebäude verwalten?', a: 'Ja, alle Pakete unterstützen mehrere Gebäude.' },
    { q: 'Wie exportiere ich meine Daten?', a: 'Verwenden Sie die Datenimport/Export Seite im Admin-Bereich.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🆘 Hilfecenter</h1>
        <p className="text-slate-600 mt-1">Finden Sie Antworten und Support für alle Fragen</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input 
          placeholder="Fragen Sie hier... (z.B. 'Wie erstelle ich einen Mieter?')" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      <Tabs defaultValue="articles">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles">📚 Artikel</TabsTrigger>
          <TabsTrigger value="faq">❓ FAQ</TabsTrigger>
          <TabsTrigger value="contact">💬 Support</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id} className="border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{article.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{article.category} • {article.views} Aufrufe</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="faq" className="space-y-3">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="border border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Support kontaktieren</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-3">Unser Support-Team hilft gerne:</p>
                <div className="space-y-2">
                  <p className="text-sm text-slate-700">📧 <strong>Email:</strong> support@immoverwalter.de</p>
                  <p className="text-sm text-slate-700">📞 <strong>Telefon:</strong> +49 30 123456789</p>
                  <p className="text-sm text-slate-700">⏰ <strong>Zeiten:</strong> Mo-Fr 09:00-18:00 Uhr</p>
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Ticket erstellen</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}