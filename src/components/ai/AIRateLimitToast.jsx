import { toast } from 'sonner';
import { AlertCircle, Clock } from 'lucide-react';

export function showRateLimitWarning(remainingRequests, timeWindow = 'hour') {
  if (remainingRequests <= 5 && remainingRequests > 0) {
    toast.warning(
      `Nur noch ${remainingRequests} KI-Anfrage${remainingRequests === 1 ? '' : 'n'} diese ${timeWindow === 'hour' ? 'Stunde' : 'Tag'} verfügbar`,
      {
        icon: <Clock className="w-4 h-4" />,
        duration: 5000
      }
    );
  } else if (remainingRequests <= 0) {
    toast.error(
      `Rate-Limit erreicht. Bitte warten Sie bis zur nächsten ${timeWindow === 'hour' ? 'Stunde' : 'Tag'}.`,
      {
        icon: <AlertCircle className="w-4 h-4" />,
        duration: 8000
      }
    );
  }
}

export function showBudgetWarning(budgetPercent) {
  if (budgetPercent >= 100) {
    toast.error(
      'Monatliches KI-Budget erreicht. Weitere Anfragen sind blockiert.',
      {
        icon: <AlertCircle className="w-4 h-4" />,
        duration: 10000,
        action: {
          label: 'Einstellungen',
          onClick: () => window.location.href = '/AISettings'
        }
      }
    );
  } else if (budgetPercent >= 90) {
    toast.warning(
      `KI-Budget zu ${budgetPercent.toFixed(0)}% ausgeschöpft`,
      {
        icon: <AlertCircle className="w-4 h-4" />,
        duration: 6000
      }
    );
  }
}