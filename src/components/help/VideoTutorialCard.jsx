import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Clock } from 'lucide-react';

export default function VideoTutorialCard({ 
  title, 
  duration,
  thumbnail,
  videoUrl,
  description 
}) {
  return (
    <Card className="vf-card-clickable">
      <div className="relative aspect-video bg-[var(--vf-neutral-200)] rounded-t-lg overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-16 w-16 text-[var(--vf-neutral-400)]" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-8 w-8 text-[var(--vf-primary-600)] ml-1" />
          </div>
        </div>
        {duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {duration}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--theme-text-secondary)]">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}