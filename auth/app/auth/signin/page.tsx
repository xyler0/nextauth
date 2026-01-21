import { signIn } from "@/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  
  // Default to frontend URL if no callback provided
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const callbackUrl = params.callbackUrl || `${frontendUrl}/auth/callback`;

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
                Authentication error. Please try again.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: callbackUrl });
        }}
      >
        <button type="submit">
          Continue with GitHub
        </button>
      </form>

           <form
        action={async () => {
          "use server";
          await signIn("twitter", { redirectTo: callbackUrl });
        }}
      >
        <button type="submit">
          Continue with Twitter
        </button>
      </form>
        </div>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}