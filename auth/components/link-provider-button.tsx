"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface LinkProviderButtonProps {
  provider: "github" | "twitter";
}

export function LinkProviderButton({ provider }: LinkProviderButtonProps) {
  const [isLinking, setIsLinking] = useState(false);

  const handleLink = async () => {
    if (isLinking) return;
    setIsLinking(true);

    try {
      await signIn(provider, {
        callbackUrl: "/settings",
        redirect: true,
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <button
      onClick={handleLink}
      disabled={isLinking}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLinking ? "Connecting..." : "Connect"}
    </button>
  );
}
