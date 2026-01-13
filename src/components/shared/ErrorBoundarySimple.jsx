import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundarySimple extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Etwas ist schief gelaufen</h2>
          <p className="text-sm text-slate-600 mb-6 max-w-md">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie, die Seite zu aktualisieren.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RotateCw className="w-4 h-4" />
            Seite aktualisieren
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}