import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ElsterErrorDisplay({ errors = [], warnings = [], onFixClick }) {
    if (errors.length === 0 && warnings.length === 0) {
        return null;
    }

    const getSeverityConfig = (severity) => {
        if (severity === 'error') {
            return {
                icon: XCircle,
                className: 'border-red-200 bg-red-50',
                iconColor: 'text-red-600',
                textColor: 'text-red-900'
            };
        }
        if (severity === 'warning') {
            return {
                icon: AlertTriangle,
                className: 'border-yellow-200 bg-yellow-50',
                iconColor: 'text-yellow-600',
                textColor: 'text-yellow-900'
            };
        }
        return {
            icon: Info,
            className: 'border-blue-200 bg-blue-50',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-900'
        };
    };

    const allIssues = [...errors, ...warnings];

    return (
        <div className="space-y-3">
            {allIssues.map((issue, idx) => {
                const config = getSeverityConfig(issue.severity);
                const Icon = config.icon;

                return (
                    <Alert key={idx} className={config.className}>
                        <Icon className={`h-4 w-4 ${config.iconColor}`} />
                        <AlertDescription className={config.textColor}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="font-medium mb-1">{issue.message}</p>
                                    {issue.field && (
                                        <p className="text-xs opacity-80">Feld: {issue.field}</p>
                                    )}
                                    {issue.code && (
                                        <p className="text-xs opacity-70 mt-1">Code: {issue.code}</p>
                                    )}
                                    {getLosungsvorschlag(issue.code) && (
                                        <p className="text-xs mt-2 p-2 bg-white/50 rounded">
                                            💡 {getLosungsvorschlag(issue.code)}
                                        </p>
                                    )}
                                </div>
                                {issue.field && onFixClick && issue.severity === 'error' && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => onFixClick(issue.field)}
                                        className="flex-shrink-0"
                                    >
                                        Beheben
                                    </Button>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>
                );
            })}
        </div>
    );
}

function getLosungsvorschlag(code) {
    const suggestions = {
        'ERIC_GLOBAL_PRUEF_FEHLER': 'Prüfen Sie alle Pflichtfelder auf Vollständigkeit und korrekte Formatierung.',
        'ERIC_TRANSFER_ERR_CONNECTSERVER': 'Versuchen Sie es später erneut oder prüfen Sie Ihre Internetverbindung.',
        'ERIC_CRYPT_ERROR_PIN_WRONG': 'Stellen Sie sicher, dass Sie die korrekte PIN zu Ihrem Zertifikat eingeben.',
        'ERIC_CRYPT_ERROR_CERT_EXPIRED': 'Laden Sie ein neues, gültiges Zertifikat hoch.',
        'ERIC_GLOBAL_NULL_PARAMETER': 'Füllen Sie alle erforderlichen Felder in der Steuererklärung aus.'
    };

    return suggestions[code] || null;
}