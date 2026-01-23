import { auth } from "@/auth";
import ConnectedAccounts from "@/components/settings/ConnectedAccounts";
import GitHubRepos from "@/components/settings/GitHubRepos";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null; // Protected layout will handle redirect
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      {/* User Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{session.user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{session.user.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">User ID:</span>
            <span className="font-mono text-sm text-gray-500">{session.user.id}</span>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <ConnectedAccounts userId={session.user.id} />
      </div>

      {/* GitHub Repos */}
      <div className="bg-white rounded-lg shadow p-6">
        <GitHubRepos userId={session.user.id} />
      </div>
    </div>
  );
}