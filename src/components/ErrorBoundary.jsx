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
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            backgroundColor: '#fef2f2',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#991b1b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Something Went Wrong</h1>
            <p style={{ fontSize: '1rem', marginBottom: '1rem', lineHeight: 1.6 }}>
              We encountered an unexpected error. Please try refreshing the page or click the button below.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(128, 29, 29, 0.1)',
                  borderRadius: '4px',
                  textAlign: 'left',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Error Details
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.875rem',
                    margin: 0,
                  }}
                >
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#b91c1c')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#dc2626')}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
