import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HelpCircle, Search, Book, Video, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const helpTopics = [
  { 
    id: 'getting-started', 
    icon: Book, 
    title: 'Erste Schritte',
    description: 'Grundlagen und Einrichtung'
  },
  { 
    id: 'tutorials', 
    icon: Video, 
    title: 'Video-Tutorials',
    description: 'Schritt-für-Schritt Anleitungen'
  },
  { 
    id: 'faq', 
    icon: HelpCircle, 
    title: 'FAQ',
    description: 'Häufig gestellte Fragen'
  },
  { 
    id: 'contact', 
    icon: MessageCircle, 
    title: 'Support kontaktieren',
    description: 'Direkte Hilfe erhalten'
  }
];

export default function HelpSystem() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 left-6 z-50 w-12 h-12 rounded-full shadow-lg bg-white"
        title="Hilfe"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-24 left-20 z-50 w-96"
          >
            <Card className="shadow-2xl">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Hilfe & Support
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Hilfe durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="space-y-2">
                  {helpTopics.map((topic, idx) => {
                    const Icon = topic.icon;
                    return (
                      <motion.button
                        key={topic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="w-full text-left p-3 rounded-lg hover:bg-slate-50 border border-slate-200 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {topic.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              {topic.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 text-center">
                    Brauchen Sie weitere Hilfe? 
                    <button className="text-blue-600 hover:underline ml-1">
                      Kontaktieren Sie uns
                    </button>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}