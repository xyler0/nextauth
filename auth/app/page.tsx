import { auth } from "@/auth";
import { signOut } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Auth Service
          </h1>

          {session?.user ? (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">Signed in as</div>
                <div className="text-xl font-semibold text-gray-900">
                  {session.user.email}
                </div>
                <div className="text-gray-600">{session.user.name}</div>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">You are not signed in</p>
              <a
                href="/auth/signin"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}