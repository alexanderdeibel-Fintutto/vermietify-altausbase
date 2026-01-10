import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Play } from 'lucide-react';

export default function VideoTutorials() {
  const tutorials = [
    { id: 1, title: 'Erste Schritte', duration: '5:23', level: 'Beginner' },
    { id: 2, title: 'Mieter anlegen', duration: '3:45', level: 'Beginner' },
    { id: 3, title: 'Buchhaltung einrichten', duration: '8:12', level: 'Fortgeschritten' },
    { id: 4, title: 'Automatisierung nutzen', duration: '6:34', level: 'Expert' }
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
        {tutorials.map(tutorial => (
          <div key={tutorial.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">{tutorial.title}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-slate-600">{tutorial.duration}</span>
                  <Badge variant="outline" className="text-xs">{tutorial.level}</Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}