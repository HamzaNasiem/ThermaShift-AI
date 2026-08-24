import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 font-mono text-xs space-y-2 m-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-red-300">
              ⚠️ {this.props.fallbackTitle || 'Component Error'}
            </span>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-2 py-1 bg-red-900/60 hover:bg-red-800 rounded text-[10px] text-white border border-red-500/40"
            >
              Retry
            </button>
          </div>
          <p className="text-[11px] text-red-300/80 font-sans">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
