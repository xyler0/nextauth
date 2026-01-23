interface GitHubReposProps {
  userId: string;
}

export default async function GitHubRepos({ userId }: GitHubReposProps) {
  // TODO: Fetch GitHub repos if connected
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">GitHub Repositories</h2>
      <div className="p-6 border rounded-lg text-center text-gray-600">
        Connect your GitHub account to see your repositories
      </div>
    </div>
  );
}