import React from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function TaxFormField({ 
    zeile, 
    label, 
    value, 
    onChange, 
    help, 
    validationStatus = 'none',
    validationMessage,
    disabled = false,
    type = 'number'
}) {
    const getStatusIcon = () => {
        if (validationStatus === 'valid') {
            return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        }
        if (validationStatus === 'warning') {
            return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
        }
        if (validationStatus === 'error') {
            return <XCircle className="h-4 w-4 text-red-600" />;
        }
        return null;
    };

    const getBorderColor = () => {
        if (validationStatus === 'error') return 'border-red-300 focus:border-red-500';
        if (validationStatus === 'warning') return 'border-yellow-300 focus:border-yellow-500';
        if (validationStatus === 'valid') return 'border-green-300 focus:border-green-500';
        return '';
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">
                    Zeile {zeile}: {label}
                </label>
                {help && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button type="button" className="text-slate-400 hover:text-slate-600">
                                    <Info className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs max-w-xs">{help}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                {getStatusIcon()}
            </div>

            <div className="relative">
                <Input 
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    disabled={disabled}
                    className={getBorderColor()}
                    step="0.01"
                />
                {type === 'number' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
                )}
            </div>

            {validationMessage && (
                <p className={`text-xs ${
                    validationStatus === 'error' ? 'text-red-600' : 
                    validationStatus === 'warning' ? 'text-yellow-600' : 
                    'text-slate-500'
                }`}>
                    {validationMessage}
                </p>
            )}
        </div>
    );
}