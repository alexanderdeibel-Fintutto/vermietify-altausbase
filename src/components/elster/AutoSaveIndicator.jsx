import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Save, CheckCircle, Loader2 } from 'lucide-react';

export default function AutoSaveIndicator({ isSaving, lastSaved }) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - new Date(lastSaved).getTime()) / 1000);
      if (seconds < 60) setTimeAgo('gerade eben');
      else if (seconds < 3600) setTimeAgo(`vor ${Math.floor(seconds / 60)} Min`);
      else setTimeAgo(`vor ${Math.floor(seconds / 3600)} Std`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  if (isSaving) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Speichert...
      </Badge>
    );
  }

  if (lastSaved) {
    return (
      <Badge variant="outline" className="gap-1 bg-green-50 border-green-200 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Gespeichert {timeAgo}
      </Badge>
    );
  }

  return null;
}