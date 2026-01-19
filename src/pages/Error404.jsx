import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Error404() {
    return (
        <div className="vf-error-page">
            <div className="vf-error-page__content">
                <div className="vf-error-page__code">404</div>
                <div className="vf-error-page__title">Seite nicht gefunden</div>
                <div className="vf-error-page__description">
                    Die angeforderte Seite existiert leider nicht. Möglicherweise wurde sie verschoben oder gelöscht.
                </div>
                <div className="vf-error-page__actions">
                    <Link to={createPageUrl('Dashboard')}>
                        <Button className="vf-btn-gradient">
                            <Home className="w-4 h-4" />
                            Zum Dashboard
                        </Button>
                    </Link>
                    <Link to={createPageUrl('AdvancedSearch')}>
                        <Button variant="outline">
                            <Search className="w-4 h-4" />
                            Suche
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}