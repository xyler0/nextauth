"use client";

import { useState } from "react";
import { forceClearCache } from "@/actions/auth-actions";
import { Loader2, RefreshCw } from "lucide-react";

export default function CacheClearButton() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState("");

  const handleClear = async () => {
    setIsClearing(true);
    setMessage("");

    try {
      const result = await forceClearCache();
      setMessage(result.message);
      
      // Reload page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setMessage("Failed to clear cache");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">Cache Management</h3>
      <p className="text-sm text-gray-600 mb-4">
        If you're seeing stale data or login issues, clear the app cache.
      </p>
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{message}</p>
        </div>
      )}
      
      <button
        onClick={handleClear}
        disabled={isClearing}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 transition-colors"
      >
        {isClearing ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            <span>Clearing...</span>
          </>
        ) : (
          <>
            <RefreshCw size={16} />
            <span>Clear Cache</span>
          </>
        )}
      </button>
    </div>
  );
}