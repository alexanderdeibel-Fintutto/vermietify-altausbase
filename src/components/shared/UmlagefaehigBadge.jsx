import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function UmlagefaehigBadge({ status }) {
  const statusConfig = {
    true: {
      label: '🟢 Umlagefähig',
      className: 'bg-green-100 text-green-800',
    },
    false: {
      label: '🔴 Nicht umlagefähig',
      className: 'bg-red-100 text-red-800',
    },
    partial: {
      label: '🟡 Teilweise umlagefähig',
      className: 'bg-amber-100 text-amber-800',
    },
  };

  const config = statusConfig[status] || statusConfig[false];

  return <Badge className={config.className}>{config.label}</Badge>;
}