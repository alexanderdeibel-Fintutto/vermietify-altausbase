import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

export default function LiveEditorIndicators({ editors = [] }) {
  const getColorForEditor = (index) => COLORS[index % COLORS.length];

  if (editors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600">Aktive Bearbeiter:</span>
      <div className="flex -space-x-2">
        {editors.slice(0, 3).map((editor, idx) => (
          <Tooltip key={editor.user_email}>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-white">
                <AvatarFallback
                  className="text-xs text-white text-center"
                  style={{
                    backgroundColor: getColorForEditor(idx)
                  }}
                >
                  {editor.user_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-xs">
                <p className="font-medium">{editor.user_name}</p>
                <p className="text-slate-400">
                  Aktiv vor {calculateTimeAgo(editor.last_activity)}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {editors.length > 3 && (
          <Avatar className="h-6 w-6 border-2 border-white bg-slate-300">
            <AvatarFallback className="text-xs">
              +{editors.length - 3}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

function calculateTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const seconds = Math.floor((now - time) / 1000);

  if (seconds < 60) return 'gerade eben';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}