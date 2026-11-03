import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Yamo Application Runtime Error Boundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #d1fae5',
              boxShadow: '0 12px 36px rgba(23, 77, 58, 0.12)',
              padding: '36px 28px',
              textAlign: 'center',
            }}
          >
            {/* Yamo Brand Forest Green Emblem */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#174D3A',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(23, 77, 58, 0.28)',
              }}
            >
              🚗
            </div>

            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#174D3A',
                marginBottom: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              Something went wrong loading this screen
            </h2>

            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#475569',
                marginBottom: '24px',
              }}
            >
              Yamo encountered an unexpected error while preparing this journey. Your account and booking data remain safe.
            </p>

            <button
              type="button"
              onClick={this.handleReset}
              style={{
                background: '#174D3A',
                color: '#ffffff',
                border: 'none',
                borderRadius: '9999px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(23, 77, 58, 0.25)',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#047857';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#174D3A';
              }}
            >
              <span>← Return to Yamo Home</span>
            </button>

            {this.state.error && (
              <details
                style={{
                  marginTop: '28px',
                  textAlign: 'left',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#334155' }}>
                  Technical error details
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
