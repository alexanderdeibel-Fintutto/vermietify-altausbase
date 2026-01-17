import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export default function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

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
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white border border-[var(--theme-border)] rounded-lg shadow-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold mb-1">vermitify installieren</h4>
            <p className="text-sm text-[var(--theme-text-secondary)]">
              Installieren Sie die App für schnelleren Zugriff
            </p>
          </div>
          <button onClick={() => setShowPrompt(false)}>
            <X className="h-5 w-5 text-[var(--theme-text-muted)]" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="gradient" className="flex-1" onClick={handleInstall}>
            <Download className="h-4 w-4 mr-2" />
            Installieren
          </Button>
          <Button variant="outline" onClick={() => setShowPrompt(false)}>
            Später
          </Button>
        </div>
      </div>
    </div>
  );
}