import React from 'react';
import { Volume2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessibilityHelper() {
  const [screenReaderEnabled, setScreenReaderEnabled] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);

  const toggleScreenReader = () => {
    const enabled = !screenReaderEnabled;
    setScreenReaderEnabled(enabled);
    if (enabled) {
      localStorage.setItem('screenReaderEnabled', 'true');
      document.documentElement.setAttribute('aria-label', 'Screen reader enabled');
    } else {
      localStorage.removeItem('screenReaderEnabled');
    }
  };

  const toggleHighContrast = () => {
    const enabled = !highContrast;
    setHighContrast(enabled);
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.removeItem('highContrast');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleScreenReader}
        title="Bildschirmleser"
        className={screenReaderEnabled ? 'bg-blue-50' : ''}
      >
        <Volume2 className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleHighContrast}
        title="Hoher Kontrast"
        className={highContrast ? 'bg-blue-50' : ''}
      >
        {highContrast ? (
          <Eye className="w-4 h-4" />
        ) : (
          <EyeOff className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}