"use client";

import { useState } from "react";
import { unlinkProvider } from "@/actions/auth-actions";
import { ConfirmDialog } from "./confirm-dialog";

interface UnlinkProviderButtonProps {
  provider: string;
}

export function UnlinkProviderButton({ provider }: UnlinkProviderButtonProps) {
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlink = async () => {
    setIsUnlinking(true);
    setError(null);
    try {
      await unlinkProvider(provider);
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlink provider';
      setError(errorMessage);
      console.error('Failed to unlink provider:', err);
    } finally {
      setIsUnlinking(false);
      if (!error) {
        setShowConfirm(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Disconnect
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Disconnect Provider"
        message={
          error 
            ? error 
            : `Are you sure you want to disconnect ${provider}? You can always reconnect later.`
        }
        confirmText="Disconnect"
        onConfirm={handleUnlink}
        onCancel={() => {
          setShowConfirm(false);
          setError(null);
        }}
        isLoading={isUnlinking}
      />
    </>
  );
}