// ============================================================
// Mythral Client - Error Boundary
// Catches React render errors and shows a recovery screen
// instead of a blank white page.
// ============================================================

import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleClearCache = () => {
    try {
      localStorage.removeItem('mythral_token')
      localStorage.removeItem('mythral_settings')
    } catch {}
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-panel">
            <div className="error-boundary-icon">⚠</div>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-msg">
              The game encountered an unexpected error. Your progress is auto-saved on the server.
            </p>
            {this.state.error && (
              <details className="error-boundary-details">
                <summary>Error details</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <div className="error-boundary-actions">
              <button className="mythral-btn mythral-btn-primary" onClick={this.handleReload}>
                Reload Game
              </button>
              <button className="mythral-btn mythral-btn-danger" onClick={this.handleClearCache}>
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
