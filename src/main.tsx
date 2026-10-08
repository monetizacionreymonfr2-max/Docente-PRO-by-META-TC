import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure global isGuest exists so no component or legacy chunk crashes
if (typeof window !== 'undefined') {
  (window as any).isGuest = false;
}

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto mt-10 bg-red-50 text-red-900 rounded-2xl border border-red-200">
          <h1 className="text-2xl font-bold mb-4">Ups, ocurrió un error inesperado</h1>
          <p className="mb-4">Se produjo un error crítico que detuvo la aplicación.</p>
          <pre className="bg-white p-4 rounded-lg overflow-auto text-sm shadow-sm">{this.state.error?.message}</pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Recargar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
