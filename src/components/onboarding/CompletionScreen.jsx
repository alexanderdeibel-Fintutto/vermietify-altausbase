import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, FileText, CreditCard, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import confetti from 'canvas-confetti';

export default function CompletionScreen({ userType, packageName }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Feuerwerk-Effekt
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const quickLinks = {
    immobilienverwaltung: [
      { name: 'Dashboard', icon: Home, page: 'Dashboard', description: 'Ihre Übersicht' },
      { name: 'Objekte', icon: Home, page: 'Buildings', description: 'Objekte verwalten' },
      { name: 'Finanzen', icon: CreditCard, page: 'Finanzen', description: 'Einnahmen & Ausgaben' },
      { name: 'Dokumente', icon: FileText, page: 'Documents', description: 'Verträge & Belege' }
    ]
  }[packageName] || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            🎉 Fantastisch! Ihr Setup ist komplett!
          </h2>
          
          <p className="text-slate-600 mb-6">
            Sie können jetzt richtig loslegen. Viel Erfolg mit EasyVermieter!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => navigate(createPageUrl('Dashboard'))}
            >
              <Home className="w-4 h-4 mr-2" />
              Zum Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(createPageUrl('HilfeCenter'))}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Hilfe & Tutorials
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {quickLinks.map(link => (
          <Card
            key={link.page}
            className="hover:border-emerald-300 transition-colors cursor-pointer"
            onClick={() => navigate(createPageUrl(link.page))}
          >
            <CardContent className="p-4">
              <link.icon className="w-8 h-8 text-emerald-600 mb-2" />
              <h3 className="font-medium text-slate-900">{link.name}</h3>
              <p className="text-sm text-slate-600">{link.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-slate-600">
            💡 <strong>Tipp:</strong> Sie können den Setup-Assistenten jederzeit über das Menü erneut starten.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}