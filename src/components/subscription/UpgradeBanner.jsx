import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UpgradeBanner({ onDismiss }) {
  return (
    <div className="bg-[var(--vf-gradient-primary)] text-white rounded-lg p-6 mb-6 relative">
      <button 
        onClick={onDismiss}
        className="absolute top-4 right-4 opacity-70 hover:opacity-100"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Upgraden Sie auf Professional</h3>
          <p className="opacity-90 mb-4">
            Unbegrenzt Objekte, automatische Anlage V, BK-Abrechnungen - sparen Sie 20% bei jährlicher Zahlung
          </p>
          <Link to={createPageUrl('Pricing')}>
            <Button variant="secondary" size="lg">
              Jetzt upgraden →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}