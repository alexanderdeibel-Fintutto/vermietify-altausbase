import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Send, FileText } from 'lucide-react';

export default function StatementStatusBadge({ status }) {
  const config = {
    'Entwurf': {
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-700',
      label: 'Entwurf'
    },
    'Berechnet': {
      icon: FileText,
      className: 'bg-blue-100 text-blue-700',
      label: 'Berechnet'
    },
    'Geprüft': {
      icon: CheckCircle,
      className: 'bg-purple-100 text-purple-700',
      label: 'Geprüft'
    },
    'Versendet': {
      icon: Send,
      className: 'bg-green-100 text-green-700',
      label: 'Versendet'
    }
  };

  const { icon: Icon, className, label } = config[status] || config['Entwurf'];

  return (
    <Badge className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}