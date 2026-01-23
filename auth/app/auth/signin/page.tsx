"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Authentication error: {error}
            </p>
          </div>
        )}

        <button
          onClick={() =>
            signIn("github", { callbackUrl: "/dashboard" })
          }
          className="w-full px-4 py-3 border rounded-md"
        >
          Continue with GitHub
        </button>

        <button
          onClick={() =>
            signIn("twitter", { callbackUrl: "/dashboard" })
          }
          className="w-full px-4 py-3 border rounded-md"
        >
          Continue with Twitter
        </button>
      </div>
    </div>
  );
}
