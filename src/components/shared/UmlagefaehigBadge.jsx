import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UmlagefaehigBadge({ value, showIcon = true, className }) {
  const config = {
    yes: {
      label: 'Umlagefähig',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-300'
    },
    no: {
      label: 'Nicht umlagefähig',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-300'
    },
    partial: {
      label: 'Teilweise umlagefähig',
      icon: AlertCircle,
      className: 'bg-amber-100 text-amber-800 border-amber-300'
    }
  };

  const setting = config[value] || config.no;
  const Icon = setting.icon;

  return (
    <Badge variant="outline" className={cn(setting.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {setting.label}
    </Badge>
  );
}