'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error('Caught by error.tsx boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-rose-500" />
      </div>
      <h2 className="text-2xl font-bold mb-3 tracking-tight">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        We encountered an unexpected error while trying to render this page. 
        Please try again, or return to the dashboard.
      </p>
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => reset()}
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl h-11 px-6 font-bold flex items-center gap-2 transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Button 
          onClick={() => router.push('/dashboard')}
          className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-700/50 text-white rounded-xl h-11 px-6 font-bold flex items-center gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
