import { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}


export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });

    // Log to error reporting service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-4 border-black rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 border-2 border-red-600 rounded-full p-3">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-6">
              We encountered an unexpected error. Please try refreshing the page
              or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-sm">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-gray-100 border border-gray-300 rounded p-3 overflow-auto max-h-48">
                  <pre className="text-xs text-red-600">
                    {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        {"\n\n"}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-black text-white border-2 border-black rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-white text-black border-2 border-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
