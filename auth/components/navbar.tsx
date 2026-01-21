import { auth, signOut } from "@/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <a href="/" className="text-xl font-bold text-gray-900">
            Auth Service
          </a>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <a
                  href="/settings"
                  className="text-gray-700 hover:text-gray-900"
                >
                  Settings
                </a>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <a
                href="/auth/signin"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}