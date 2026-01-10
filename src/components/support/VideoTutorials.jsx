import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Play } from 'lucide-react';

export default function VideoTutorials() {
  const tutorials = [
    { id: '1', title: 'Erste Schritte', duration: '5:30', category: 'Basics' },
    { id: '2', title: 'Dokumente hochladen', duration: '3:45', category: 'Dokumente' },
    { id: '3', title: 'Steuererklärung', duration: '12:00', category: 'Steuer' },
    { id: '4', title: 'Vermögen verwalten', duration: '8:20', category: 'Vermögen' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video-Tutorials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tutorials.map(tut => (
          <div key={tut.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-sm">{tut.title}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{tut.category}</Badge>
                <span className="text-xs text-slate-600">{tut.duration}</span>
              </div>
            </div>
            <Button size="icon" variant="ghost">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}