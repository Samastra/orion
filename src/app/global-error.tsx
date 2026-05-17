'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Caught by global-error.tsx boundary:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0b] text-foreground min-h-screen antialiased flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight text-white">Critical Error</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            A fatal error occurred that prevented the application from loading. 
            Please refresh the page to try again.
          </p>
          <button 
            onClick={() => reset()}
            className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-700/50 text-white rounded-xl h-11 px-6 font-bold flex items-center gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
