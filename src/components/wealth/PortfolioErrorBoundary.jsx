import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class PortfolioErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log zu Console für Debugging
    console.error('Portfolio Error:', error);
    console.error('Error Info:', errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-light text-red-900 mb-2">
                Fehler beim Laden des Vermögensportfolios
              </h3>
              <p className="text-sm font-light text-red-800 mb-4">
                {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs text-red-700 mb-4 font-mono bg-red-100 p-2 rounded max-h-32 overflow-y-auto">
                  <summary className="cursor-pointer font-light">Debug-Informationen</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <Button
                onClick={this.handleReset}
                className="bg-red-600 hover:bg-red-700 text-white font-light gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Erneut versuchen
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}