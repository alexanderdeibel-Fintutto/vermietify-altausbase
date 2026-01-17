import React from 'react';
import { Play } from 'lucide-react';

export default function VideoTutorialInline({ videoId, title }) {
  return (
    <div className="bg-[var(--vf-info-50)] border border-[var(--vf-info-200)] rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--vf-info-500)] flex items-center justify-center text-white flex-shrink-0">
          <Play className="h-5 w-5 ml-0.5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-[var(--vf-info-900)]">Video-Tutorial</div>
          <div className="text-sm text-[var(--vf-info-700)]">{title}</div>
        </div>
        <button className="text-[var(--vf-info-600)] hover:text-[var(--vf-info-700)] font-medium text-sm">
          Ansehen →
        </button>
      </div>
    </div>
  );
}