import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Zap } from 'lucide-react';

export default function AutoCreateUnitsHint({ buildingId, onAutoCreate }) {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const key = `auto-units-hint-dismissed-${buildingId}`;
    setDismissed(localStorage.getItem(key) === 'true');
  }, [buildingId]);

  const handleDismiss = () => {
    const key = `auto-units-hint-dismissed-${buildingId}`;
    localStorage.setItem(key, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-blue-900 mb-1">
            💡 Tipp: Einheiten automatisch erstellen
          </p>
          <p className="text-sm text-blue-700 mb-3">
            Sie können alle Einheiten auf einmal erstellen lassen, z.B. "EG-Links, EG-Rechts, 1.OG-Links..." 
            statt jede einzeln anzulegen.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onAutoCreate}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Zap className="w-4 h-4" />
              Einheiten automatisch erstellen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-blue-600"
            >
              Nicht mehr anzeigen
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}