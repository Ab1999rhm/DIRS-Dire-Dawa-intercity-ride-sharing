import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    const sensitivePatterns = /mongodb|mongoose|ENOTFOUND|ECONNREFUSED|getaddrinfo|password|token|jwt|tls|certificate|uri|connection string/i;
    const safeMessage = sensitivePatterns.test(error.message)
      ? 'A service error occurred'
      : error.message;

    console.error('[ErrorBoundary]', {
      component: errorInfo.componentStack?.trim()?.split('\n')?.[1]?.trim() || 'Unknown',
      error: safeMessage,
      timestamp: new Date().toISOString(),
    });

    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleCopyError = async () => {
    const details = [
      '=== DIRS Error Report ===',
      `Time: ${new Date().toISOString()}`,
      `Error: An unexpected error occurred`,
      '',
      'Please contact support with this report.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(details);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = details;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          background: 'var(--bg, #f8fafc)'
        }}>
          <div style={{
            background: 'var(--card, #fff)',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '8px',
              color: 'var(--text, #0f172a)'
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary, #64748b)',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary, #2563eb)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: 'transparent',
                  color: 'var(--text, #0f172a)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Go Home
              </button>
              <button
                onClick={this.handleCopyError}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: 'transparent',
                  color: 'var(--text-secondary, #64748b)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Report
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
