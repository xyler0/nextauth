"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  const callbackUrl =
    searchParams.get("callbackUrl") ??
    `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/callback`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                Authentication error: {error}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() =>
              signIn("github", {
                callbackUrl,
              })
            }
            className="w-full px-4 py-3 border rounded-md"
          >
            Continue with GitHub
          </button>

          <button
            onClick={() =>
              signIn("twitter", {
                callbackUrl,
              })
            }
            className="w-full px-4 py-3 border rounded-md"
          >
            Continue with Twitter
          </button>
        </div>

        <p className="text-center text-sm text-gray-600">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
