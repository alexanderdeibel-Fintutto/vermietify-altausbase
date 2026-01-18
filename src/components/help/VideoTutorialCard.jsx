import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';

export default function VideoTutorialCard({ title, duration, thumbnail, videoUrl }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'} 
          alt={title}
          className="w-full h-40 object-cover rounded-t-lg"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <Play className="h-6 w-6 text-[var(--theme-primary)]" />
          </div>
        </div>
      </div>
      <CardContent className="pt-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-xs text-[var(--theme-text-muted)]">{duration || '5 Min.'}</p>
      </CardContent>
    </Card>
  );
}