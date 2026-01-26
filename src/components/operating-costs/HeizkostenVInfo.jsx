import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, AlertCircle, Info } from 'lucide-react';

export default function HeizkostenVInfo({ showDetails = false }) {
  return (
    <Card className="bg-orange-50 border-orange-200">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Flame className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold text-sm">HeizkostenV-Aufteilung</p>
              <Badge variant="outline" className="text-xs">§7-9 HeizkostenV</Badge>
            </div>
            
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>70%</strong> verbrauchsabhängig nach Zählerständen
              </p>
              <p>
                <strong>30%</strong> Grundkosten nach Wohnfläche
              </p>
              
              {showDetails && (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      Falls keine Zählerstände vorhanden sind, wird der verbrauchsabhängige Anteil 
                      ebenfalls nach Wohnfläche verteilt.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}