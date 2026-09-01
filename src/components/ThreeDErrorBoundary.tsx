import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Eye, Box } from 'lucide-react';

interface Props {
  children: ReactNode;
  organName?: string;
  onFallbackTo2D?: () => void;
  onFallbackToPreset?: () => void;
  theme?: 'dark' | 'light';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ThreeDErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ThreeDErrorBoundary caught a 3D rendering error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      const isDark = this.props.theme !== 'light';
      const errorMessage = this.state.error?.message || 'Format berkas 3D tidak dikenali atau akselerasi WebGL browser tidak tersedia.';

      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`} id="3d-error-boundary-screen">
          
          {/* Subtle Background Radial Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className={`relative z-10 max-w-lg p-6 sm:p-8 rounded-2xl border shadow-2xl backdrop-blur-xl ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200'
          }`}>
            
            {/* Warning Icon Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-4 shadow-lg">
              <AlertTriangle className="h-8 w-8 animate-pulse" />
            </div>

            <h3 className="text-base sm:text-lg font-bold">
              Gagal Memuat Visualisasi 3D
            </h3>

            <p className="mt-1 text-xs text-teal-400 font-mono">
              {this.props.organName ? `Organ: ${this.props.organName}` : 'Objek Anatomi 3D'}
            </p>

            <div className={`mt-4 p-3 rounded-xl border text-left text-[11px] font-mono leading-relaxed overflow-x-auto ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <span className="font-bold block mb-1">Penyebab Error:</span>
              <p className="line-clamp-3">{errorMessage}</p>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Sistem proteksi aktif mencegah aplikasi crash (*White Screen of Death*). Anda dapat memuat ulang model atau beralih ke diagram 2D beresolusi tinggi.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              
              {/* Retry 3D */}
              <button
                type="button"
                onClick={this.resetErrorBoundary}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Muat Ulang 3D</span>
              </button>

              {/* Fallback to 2D Diagram */}
              {this.props.onFallbackTo2D && (
                <button
                  type="button"
                  onClick={() => {
                    this.resetErrorBoundary();
                    this.props.onFallbackTo2D?.();
                  }}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-4 h-4 text-teal-400" />
                  <span>Buka Diagram 2D</span>
                </button>
              )}

              {/* Fallback to Standard Procedural Preset */}
              {this.props.onFallbackToPreset && (
                <button
                  type="button"
                  onClick={() => {
                    this.resetErrorBoundary();
                    this.props.onFallbackToPreset?.();
                  }}
                  className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-800 text-amber-300 hover:border-amber-500' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>Model Prosedural</span>
                </button>
              )}

            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
