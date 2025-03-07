import React, { Component, ErrorInfo, ReactNode, useEffect } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

const ErrorFallback = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false
    }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}

export default ErrorBoundary
