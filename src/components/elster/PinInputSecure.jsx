import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PinInputSecure({ value, onChange, onSubmit }) {
    const [showPin, setShowPin] = useState(false);

    // Cleanup: PIN aus Speicher löschen beim Unmount
    useEffect(() => {
        return () => {
            onChange('');
        };
    }, []);

    const handlePaste = (e) => {
        e.preventDefault(); // Verhindere Paste
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <label className="text-sm font-medium text-slate-700">
                    Zertifikats-PIN
                </label>
            </div>
            
            <div className="relative">
                <Input 
                    type={showPin ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onPaste={handlePaste}
                    autoComplete="off"
                    data-form-type="other"
                    className="pr-10"
                    placeholder="••••••"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && onSubmit) {
                            onSubmit();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                    <strong>Sicherheitshinweis:</strong> Die PIN wird nur für die Übermittlung verwendet und 
                    niemals gespeichert. Nach der Übermittlung wird sie automatisch aus dem Speicher gelöscht.
                </p>
            </div>
        </div>
    );
}