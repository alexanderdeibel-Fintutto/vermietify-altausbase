import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TUTORIALS = {
  'bk-wizard': {
    title: 'BK-Abrechnung erstellen',
    description: 'Schritt-für-Schritt Anleitung',
    duration: '3:45',
    videoId: 'demo-bk-wizard',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop'
  },
  'contract-creation': {
    title: 'Mietvertrag anlegen',
    description: 'Alle wichtigen Felder erklärt',
    duration: '2:30',
    videoId: 'demo-contract',
    thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=225&fit=crop'
  },
  'rent-increase': {
    title: 'Mieterhöhung durchführen',
    description: 'Rechtssicher und automatisiert',
    duration: '4:15',
    videoId: 'demo-rent-increase',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop'
  },
  'invoice-categorization': {
    title: 'Rechnungen kategorisieren',
    description: 'Mit KI-Unterstützung',
    duration: '2:00',
    videoId: 'demo-invoice-cat',
    thumbnail: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=400&h=225&fit=crop'
  }
};

export default function VideoTutorialInline({ tutorialKey, compact = false }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const tutorial = TUTORIALS[tutorialKey];
  if (!tutorial) return null;

  if (compact) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="gap-2 text-blue-600 hover:text-blue-700"
        >
          <PlayCircle className="w-4 h-4" />
          Video-Tutorial ansehen
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{tutorial.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm opacity-75">Video wird geladen...</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div 
        onClick={() => setDialogOpen(true)}
        className="group relative overflow-hidden rounded-lg border border-slate-200 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg"
      >
        <div className="relative">
          <img 
            src={tutorial.thumbnail} 
            alt={tutorial.title}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <PlayCircle className="w-16 h-16 text-white opacity-90 group-hover:scale-110 transition-transform" />
          </div>
          <Badge className="absolute top-2 right-2 bg-black/70 text-white">
            {tutorial.duration}
          </Badge>
        </div>
        <div className="p-3 bg-white">
          <h4 className="font-semibold text-sm mb-1">{tutorial.title}</h4>
          <p className="text-xs text-slate-600">{tutorial.description}</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{tutorial.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-sm opacity-75">Demo-Video: {tutorial.title}</p>
              <p className="text-xs opacity-50 mt-2">In der Vollversion: Interaktives Tutorial</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}