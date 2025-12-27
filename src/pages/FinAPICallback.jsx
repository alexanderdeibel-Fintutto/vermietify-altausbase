import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function FinAPICallback() {
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Konten werden importiert...');

    useEffect(() => {
        importAccounts();
    }, []);

    const importAccounts = async () => {
        try {
            const response = await base44.functions.invoke('finapiImportAccounts', {});
            
            if (response.data.success) {
                setStatus('success');
                setMessage(response.data.message);
                
                // Close window after 2 seconds
                setTimeout(() => {
                    window.close();
                }, 2000);
            } else {
                setStatus('error');
                setMessage(response.data.error || 'Import fehlgeschlagen');
            }
        } catch (error) {
            console.error('Import error:', error);
            setStatus('error');
            setMessage('Konten konnten nicht importiert werden');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-emerald-600 mx-auto mb-4 animate-spin" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Einen Moment bitte...
                        </h2>
                        <p className="text-slate-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Erfolgreich!
                        </h2>
                        <p className="text-slate-600 mb-4">{message}</p>
                        <p className="text-sm text-slate-400">
                            Dieses Fenster schließt sich automatisch...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Fehler
                        </h2>
                        <p className="text-slate-600 mb-4">{message}</p>
                        <button
                            onClick={() => window.close()}
                            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                        >
                            Schließen
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}