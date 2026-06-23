import React from 'react'

type State = { error: Error | null }

/**
 * Catches render/runtime errors in child pages so a single page crash
 * shows a readable message instead of white-screening the whole app.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Page crashed:', error, info)
  }

  // Reset error when the route/location changes (key prop forces remount)
  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-2xl mx-auto mt-10 bg-white border border-red-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-red-700">This page hit an error</h2>
          <p className="text-sm text-gray-600">
            The rest of the app is fine — use the menu to go elsewhere, or reload this page.
          </p>
          <pre className="text-xs bg-red-50 text-red-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            onClick={this.reset}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
