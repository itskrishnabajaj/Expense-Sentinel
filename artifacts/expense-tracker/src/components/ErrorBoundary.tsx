import { Component, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full bg-[#0D0D0D] flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">💥</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
            An unexpected error occurred. Your data is safe.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-white/10 text-white text-sm font-medium rounded-xl"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl"
            >
              <RefreshCw size={14} />
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
