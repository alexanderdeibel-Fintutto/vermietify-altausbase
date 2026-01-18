import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export default function InstallPWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm bg-white border border-[var(--theme-border)] rounded-lg shadow-xl p-4 z-40">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[var(--theme-primary)] rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">App installieren</h4>
          <p className="text-sm text-[var(--theme-text-secondary)] mb-3">
            Installieren Sie Vermitify für schnellen Zugriff
          </p>
          <Button variant="gradient" size="sm" onClick={handleInstall} className="w-full">
            Installieren
          </Button>
        </div>
      </div>
    </div>
  );
}