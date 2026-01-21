"use client";

import { useState } from "react";
import { unlinkProvider } from "@/app/actions/unlink-provider";
import { ConfirmDialog } from "./confirm-dialog";

interface UnlinkProviderButtonProps {
  provider: string;
}

export function UnlinkProviderButton({ provider }: UnlinkProviderButtonProps) {
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUnlink = async () => {
    setIsUnlinking(true);
    try {
      await unlinkProvider(provider);
      window.location.reload();
    } catch (error) {
      console.error('Failed to unlink provider:', error);
      alert('Failed to unlink provider. Please try again.');
    } finally {
      setIsUnlinking(false);
      setShowConfirm(false);
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
        message={`Are you sure you want to disconnect ${provider}? You can always reconnect later.`}
        confirmText="Disconnect"
        onConfirm={handleUnlink}
        onCancel={() => setShowConfirm(false)}
        isLoading={isUnlinking}
      />
    </>
  );
}