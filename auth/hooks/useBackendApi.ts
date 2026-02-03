"use client";

import { useEffect, useState } from 'react';
import { api, configureApiWithAuth, clearAuthToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useBackendApi() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const configure = async () => {
      try {
        const success = await configureApiWithAuth();
        
        if (mounted) {
          setIsConfigured(success);
          
          if (!success) {
            // Clear any stale tokens
            clearAuthToken();
            // Redirect to signin if not authenticated
            router.push('/auth/signin');
          }
        }
      } catch (error) {
        console.error('Failed to configure API:', error);
        if (mounted) {
          setIsConfigured(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    configure();

    // Reconfigure on window focus (in case token was refreshed in another tab)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        configure();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [router]);

  return { api, isConfigured, isLoading };
}