import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Send, FileText } from 'lucide-react';

export default function ElsterStatusBadge({ status }) {
    const configs = {
        draft: {
            label: 'Entwurf',
            className: 'bg-slate-100 text-slate-700 border-slate-200',
            icon: FileText
        },
        in_progress: {
            label: 'In Bearbeitung',
            className: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: Clock
        },
        validating: {
            label: 'Wird validiert...',
            className: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: Clock,
            animate: true
        },
        validation_failed: {
            label: 'Validierung fehlgeschlagen',
            className: 'bg-red-100 text-red-700 border-red-200',
            icon: XCircle
        },
        ready: {
            label: 'Bereit zur Übermittlung',
            className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            icon: AlertTriangle
        },
        ready_for_review: {
            label: 'Bereit zur Übermittlung',
            className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            icon: AlertTriangle
        },
        submitting: {
            label: 'Wird übermittelt...',
            className: 'bg-blue-100 text-blue-700 border-blue-200',
            icon: Send,
            animate: true
        },
        submitted: {
            label: 'Übermittelt',
            className: 'bg-orange-100 text-orange-700 border-orange-200',
            icon: Send
        },
        accepted: {
            label: 'Angenommen',
            className: 'bg-green-100 text-green-700 border-green-200',
            icon: CheckCircle2
        },
        rejected: {
            label: 'Abgelehnt',
            className: 'bg-red-100 text-red-700 border-red-200',
            icon: XCircle
        },
        error: {
            label: 'Fehler',
            className: 'bg-red-100 text-red-700 border-red-200',
            icon: XCircle
        }
    };

    const config = configs[status] || configs.draft;
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
            <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} />
            {config.label}
        </Badge>
    );
}