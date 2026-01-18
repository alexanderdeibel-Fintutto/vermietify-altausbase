import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="vf-error-state text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Etwas ist schiefgelaufen</h2>
          <p className="text-[var(--theme-text-secondary)] mb-4">
            {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="vf-btn vf-btn-gradient vf-btn-md"
          >
            Erneut versuchen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;