import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Compact fallback for cards / oracle chips */
  fallback?: ReactNode
  label?: string
}

type State = { error: Error | null }

/**
 * Isolates a single widget failure so one bad model/Oracle chip cannot blank the page.
 */
export class SoftErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(this.props.label || 'SoftErrorBoundary', error, info)
  }

  componentDidUpdate(prev: Props) {
    if (prev.children !== this.props.children && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="soft-error" role="status">
          <span>Preview unavailable</span>
        </div>
      )
    }
    return this.props.children
  }
}
