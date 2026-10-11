import React from 'react'

export default class ErrorBoundary extends React.Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-2 text-muted">The page couldn’t be displayed. Try reloading.</p>
      <button type="button" className="btn mt-5 bg-brand text-white hover:bg-brand-dark" onClick={() => window.location.reload()}>Reload page</button>
    </main>
  }
}
