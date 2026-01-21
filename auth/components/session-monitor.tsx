"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SessionMonitor({ expiresAt }: { expiresAt?: string }) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const checkSession = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const remaining = expires - now;

      setTimeRemaining(remaining);

      // Redirect to signin if session expired
      if (remaining <= 0) {
        router.push('/auth/signin?error=SessionExpired');
      }
      // Warn user 5 minutes before expiry
      else if (remaining < 5 * 60 * 1000 && remaining > 0) {
        console.warn('Session expiring soon');
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [expiresAt, router]);

  return null; // This is a monitoring component, no UI
}