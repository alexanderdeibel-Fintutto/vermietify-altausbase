import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';

export default function AutoSaveIndicator({ status, lastSaved }) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const saved = new Date(lastSaved);
      const diffMs = now - saved;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 60) {
        setTimeAgo('gerade eben');
      } else if (diffMins < 60) {
        setTimeAgo(`vor ${diffMins}min`);
      } else {
        setTimeAgo(saved.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  const configs = {
    saving: {
      icon: Loader2,
      color: 'bg-blue-100 text-blue-800',
      text: 'Wird gespeichert...',
      spin: true
    },
    saved: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      text: timeAgo ? `Gespeichert ${timeAgo}` : 'Gespeichert',
      spin: false
    },
    error: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800',
      text: 'Fehler beim Speichern',
      spin: false
    },
    pending: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      text: 'Nicht gespeichert',
      spin: false
    }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.color} flex items-center gap-1.5`}>
      <Icon className={`w-3 h-3 ${config.spin ? 'animate-spin' : ''}`} />
      <span className="text-xs">{config.text}</span>
    </Badge>
  );
}