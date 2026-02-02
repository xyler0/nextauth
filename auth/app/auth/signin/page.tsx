"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SiGithub } from "react-icons/si";
import { SiX } from "react-icons/si";
import { Mail, Loader2, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  const handleOAuthSignIn = async (provider: "github" | "twitter") => {
    setIsLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsLoading("credentials");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Invalid email or password");
        setIsLoading(null);
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setFormError("Something went wrong. Please try again.");
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue to X Poster
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              {error === "OAuthAccountNotLinked"
                ? "This email is already associated with another account. Please sign in with your original method."
                : error === "AccessDenied"
                ? "Access denied. Please try again or contact support."
                : "Authentication error. Please try again."}
            </p>
          </div>
        )}

        {/* Form Error */}
        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {!showEmailForm ? (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuthSignIn("github")}
                  disabled={isLoading !== null}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading === "github" ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <SiGithub size={20} />
                  )}
                  <span>Continue with GitHub</span>
                </button>

                <button
                  onClick={() => handleOAuthSignIn("twitter")}
                  disabled={isLoading !== null}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading === "twitter" ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <SiX size={20} />
                  )}
                  <span>Continue with X (Twitter)</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or</span>
                </div>
              </div>

              {/* Email Button */}
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Mail size={20} />
                <span>Continue with Email</span>
              </button>
            </>
          ) : (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading === "credentials"}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading === "credentials" ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setFormError("");
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Back to other options
                </button>
              </form>
            </>
          )}
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}  
            <a href="/auth/signup"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign up
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}