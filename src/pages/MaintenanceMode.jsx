import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw } from 'lucide-react';

export default function MaintenanceMode() {
    return (
        <div className="vf-error-page">
            <div className="vf-error-page__content">
                <Settings className="w-24 h-24 mx-auto mb-6 text-gray-400 animate-spin" style={{ animationDuration: '3s' }} />
                <div className="vf-error-page__title">Wartungsarbeiten</div>
                <div className="vf-error-page__description">
                    Wir führen gerade wichtige Wartungsarbeiten durch, um Vermitify noch besser zu machen. 
                    Wir sind in Kürze wieder für Sie da.
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