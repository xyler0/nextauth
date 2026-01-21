"use client";

import { useState } from "react";

interface LinkProviderButtonProps {
  provider: 'github' | 'twitter';
}

export function LinkProviderButton({ provider }: LinkProviderButtonProps) {
  const [isLinking, setIsLinking] = useState(false);

  const handleLink = () => {
    setIsLinking(true);
    // Redirect to OAuth flow
    window.location.href = `/api/auth/signin/${provider}?callbackUrl=/settings`;
  };

  return (
    <button
      onClick={handleLink}
      disabled={isLinking}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLinking ? 'Connecting...' : 'Connect'}
    </button>
  );
}