import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function StatusBadge({ 
  status = 'pending',
  size = 'md'
}) {
  const configs = {
    pending: {
      label: 'Ausstehend',
      className: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    active: {
      label: 'Aktiv',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    completed: {
      label: 'Abgeschlossen',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    failed: {
      label: 'Fehler',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    archived: {
      label: 'Archiviert',
      className: 'bg-slate-100 text-slate-800 border-slate-200'
    }
  };

  const config = configs[status] || configs.pending;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <Badge className={`${config.className} ${sizeClass} border`}>
      {config.label}
    </Badge>
  );
}