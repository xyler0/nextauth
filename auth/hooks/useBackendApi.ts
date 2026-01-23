"use client";

import { useEffect, useState } from 'react';
import { api, configureApiWithAuth } from '@/lib/api';

export function useBackendApi() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    configureApiWithAuth().then(setIsConfigured);
  }, []);

  return { api, isConfigured };
}