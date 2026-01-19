import React from 'react';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineError() {
    return (
        <div className="vf-error-page">
            <div className="vf-error-page__content">
                <WifiOff className="w-24 h-24 mx-auto mb-6 text-gray-400" />
                <div className="vf-error-page__title">Keine Internetverbindung</div>
                <div className="vf-error-page__description">
                    Sie sind offline. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.
                </div>
                <div className="vf-error-page__actions">
                    <Button onClick={() => window.location.reload()} className="vf-btn-gradient">
                        <RefreshCw className="w-4 h-4" />
                        Erneut versuchen
                    </Button>
                </div>
            </div>
        </div>
    );
}