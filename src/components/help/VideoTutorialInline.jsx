import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';

export default function VideoTutorialInline({ title, videoUrl, duration = '2:30' }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-gradient-to-br from-[var(--vf-primary-100)] to-[var(--vf-accent-100)] flex items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Play className="h-8 w-8 text-[var(--theme-primary)] ml-1" />
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {duration}
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-medium">{title}</h4>
        </div>
      </CardContent>
    </Card>
  );
}