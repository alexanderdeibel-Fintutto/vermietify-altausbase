import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Error500() {
    return (
        <div className="vf-error-page">
            <div className="vf-error-page__content">
                <div className="vf-error-page__code">500</div>
                <div className="vf-error-page__title">Serverfehler</div>
                <div className="vf-error-page__description">
                    Es ist ein unerwarteter Fehler aufgetreten. Unser Team wurde benachrichtigt und arbeitet an einer Lösung.
                </div>
                <div className="vf-error-page__actions">
                    <Button onClick={() => window.location.reload()} className="vf-btn-gradient">
                        <RefreshCw className="w-4 h-4" />
                        Seite neu laden
                    </Button>
                    <Link to={createPageUrl('Dashboard')}>
                        <Button variant="outline">
                            <Home className="w-4 h-4" />
                            Zum Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}