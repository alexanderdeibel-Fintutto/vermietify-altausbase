import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, FileText, CreditCard, HelpCircle, Sparkles, Building2, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import confetti from 'canvas-confetti';

export default function CompletionScreen({ userType, packageName }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#8b5cf6']
    });
  }, []);

  const quickActions = [
    { icon: Building2, label: 'Weiteres Objekt', page: 'Buildings', color: 'bg-emerald-50 hover:bg-emerald-100' },
    { icon: Users, label: 'Mieter verwalten', page: 'Contracts', color: 'bg-blue-50 hover:bg-blue-100' },
    { icon: FileText, label: 'Dokumente', page: 'Documents', color: 'bg-purple-50 hover:bg-purple-100' },
    { icon: Calendar, label: 'Aufgaben', page: 'Tasks', color: 'bg-orange-50 hover:bg-orange-100' }
  ];

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
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <CardContent className="pt-8 pb-6 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-white" />
            </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-slate-900 mb-2"
          >
            🎉 Fantastisch! Ihr Setup ist komplett!
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-600 mb-6"
          >
            Sie können jetzt richtig loslegen. Viel Erfolg mit EasyVermieter!
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
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
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-4"
      >
        {quickLinks.map((link, idx) => (
          <motion.div
            key={link.page}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + (idx * 0.1) }}
          >
            <Card
              className="hover:border-emerald-300 transition-colors cursor-pointer"
              onClick={() => navigate(createPageUrl(link.page))}
            >
            <CardContent className="p-4">
              <link.icon className="w-8 h-8 text-emerald-600 mb-2" />
              <h3 className="font-medium text-slate-900">{link.name}</h3>
              <p className="text-sm text-slate-600">{link.description}</p>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Nächste Schritte</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => (
              <motion.button
                key={action.page}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + (idx * 0.1) }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(createPageUrl(action.page))}
                className={`p-4 rounded-xl border border-slate-200 text-left transition-all ${action.color}`}
              >
                <action.icon className="w-6 h-6 mb-2 text-slate-700" />
                <div className="text-sm font-medium text-slate-900">{action.label}</div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-slate-600">
            💡 <strong>Tipp:</strong> Sie können den Setup-Assistenten jederzeit über das Menü erneut starten.
          </p>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}