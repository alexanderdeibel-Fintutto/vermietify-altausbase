import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Eye, 
  Type, 
  Contrast, 
  ZoomIn, 
  ZoomOut,
  Keyboard,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccessibilityHelper() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [keyboardNav, setKeyboardNav] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedPrefs = localStorage.getItem('accessibility_prefs');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setFontSize(prefs.fontSize || 100);
      setHighContrast(prefs.highContrast || false);
      setKeyboardNav(prefs.keyboardNav || false);
    }
  }, []);

  useEffect(() => {
    // Apply font size
    document.documentElement.style.fontSize = `${fontSize}%`;
    
    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply keyboard navigation helpers
    if (keyboardNav) {
      document.documentElement.classList.add('keyboard-nav');
    } else {
      document.documentElement.classList.remove('keyboard-nav');
    }

    // Save preferences
    localStorage.setItem('accessibility_prefs', JSON.stringify({
      fontSize,
      highContrast,
      keyboardNav
    }));
  }, [fontSize, highContrast, keyboardNav]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 10, 150));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 10, 80));
  const resetFontSize = () => setFontSize(100);

  return (
    <>
      {/* Floating Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg bg-white"
        title="Barrierefreiheit"
      >
        <Eye className="w-5 h-5" />
      </Button>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-24 right-6 z-50 w-80"
          >
            <Card className="shadow-2xl">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Barrierefreiheit
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
                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Type className="w-4 h-4" />
                    Schriftgröße
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decreaseFontSize}
                      disabled={fontSize <= 80}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="flex-1 text-center text-sm text-slate-600">
                      {fontSize}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={increaseFontSize}
                      disabled={fontSize >= 150}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFontSize}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* High Contrast */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Contrast className="w-4 h-4" />
                    Hoher Kontrast
                  </div>
                  <Button
                    variant={highContrast ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHighContrast(!highContrast)}
                    className="w-full"
                  >
                    {highContrast ? 'Aktiviert' : 'Deaktiviert'}
                  </Button>
                </div>

                {/* Keyboard Navigation */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Keyboard className="w-4 h-4" />
                    Tastaturnavigation
                  </div>
                  <Button
                    variant={keyboardNav ? "default" : "outline"}
                    size="sm"
                    onClick={() => setKeyboardNav(!keyboardNav)}
                    className="w-full"
                  >
                    {keyboardNav ? 'Aktiviert' : 'Deaktiviert'}
                  </Button>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    💡 Tastenkürzel: Tab (Navigation), Enter (Auswählen), Esc (Schließen)
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