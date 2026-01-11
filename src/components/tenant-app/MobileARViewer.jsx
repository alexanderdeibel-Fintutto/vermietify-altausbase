import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Eye, Star, Calendar } from 'lucide-react';

export default function MobileARViewer({ viewingSessionId }) {
  const [interestRating, setInterestRating] = useState(0);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-600 to-purple-800 text-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-5 h-5" />
            AR Wohnungsbesichtigung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-black/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Smartphone className="w-16 h-16 mx-auto mb-3 opacity-75" />
              <p className="text-sm opacity-90">3D AR-Modell lädt...</p>
              <p className="text-xs opacity-75 mt-1">Bitte Kamera-Zugriff erlauben</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-sm mb-2">Steuerung:</p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• Bewegen Sie Ihr Gerät zum Umschauen</li>
              <li>• Tippen Sie auf Räume für Details</li>
              <li>• Wischen Sie für verschiedene Ansichten</li>
            </ul>
          </div>

          <div>
            <p className="text-sm mb-2">Wie gefällt Ihnen die Wohnung?</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setInterestRating(rating)}
                  className="p-2"
                >
                  <Star
                    className={`w-6 h-6 ${rating <= interestRating ? 'fill-yellow-400 text-yellow-400' : 'text-white/50'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full bg-white text-purple-600 hover:bg-white/90">
            <Calendar className="w-4 h-4 mr-2" />
            Persönliche Besichtigung buchen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}