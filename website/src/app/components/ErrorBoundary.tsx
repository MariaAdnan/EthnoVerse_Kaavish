import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled EthnoVerse render error", error, info);
  }

  private reset = () => {
    this.setState({ error: null });
    window.history.pushState({}, "", "/");
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground grid place-items-center p-8">
        <section
          className="max-w-xl border border-destructive/40 bg-card p-8"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-xs font-mono text-destructive mb-3">
            APPLICATION ERROR
          </p>
          <h1 className="text-3xl mb-4">This view could not be displayed.</h1>
          <p className="text-muted-foreground mb-8">
            Your archive data was not changed. Return home and try the action
            again.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="bg-accent text-accent-foreground px-5 py-3 font-mono"
          >
            RETURN HOME
          </button>
        </section>
      </main>
    );
  }
}
