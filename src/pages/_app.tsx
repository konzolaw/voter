import { useEffect } from 'react';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { apiClient } from '@/lib/api';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Prefetch positions, candidates, and system state in the background
    apiClient.prefetchCommon();
  }, []);

  return <Component {...pageProps} />;
}

