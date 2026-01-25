'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { CheckCircle, Circle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface GitHubReposProps {
  userId: string;
}

export default function GitHubRepos({ userId }: GitHubReposProps) {
  const { api, isConfigured } = useBackendApi();
  const queryClient = useQueryClient();
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

  // Check GitHub connection status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['github-status'],
    queryFn: async () => {
      const { data } = await api.get('/github/status');
      return data;
    },
    enabled: isConfigured,
  });

  // Fetch repositories
  const { 
    data: reposData, 
    isLoading: reposLoading,
    refetch: refetchRepos,
    isRefetching,
  } = useQuery({
    queryKey: ['github-repositories'],
    queryFn: async () => {
      const { data } = await api.get('/github/repositories');
      return data;
    },
    enabled: isConfigured && statusData?.linked,
  });

  // Initialize selected repos when data loads
  useState(() => {
    if (reposData?.monitored) {
      setSelectedRepos(reposData.monitored);
    }
  });

  // Update monitored repos mutation
  const updateReposMutation = useMutation({
    mutationFn: async (repos: string[]) => {
      const { data } = await api.put('/github/repositories', { repos });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-repositories'] });
      alert('Monitored repositories updated!');
    },
    onError: (error) => {
      console.error('Failed to update repos:', error);
      alert('Failed to update repositories');
    },
  });

  // Register webhooks mutation
  const registerWebhooksMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/github/webhook/register');
      return data;
    },
    onSuccess: (data) => {
      alert(`Webhooks registered for ${data.registered.length} repositories!`);
    },
    onError: (error) => {
      console.error('Failed to register webhooks:', error);
      alert('Failed to register webhooks');
    },
  });

  const handleToggleRepo = (repoFullName: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repoFullName)
        ? prev.filter((r) => r !== repoFullName)
        : [...prev, repoFullName]
    );
  };

  const handleSave = () => {
    updateReposMutation.mutate(selectedRepos);
  };

  const handleRegisterWebhooks = () => {
    if (selectedRepos.length === 0) {
      alert('Please select at least one repository first');
      return;
    }
    registerWebhooksMutation.mutate();
  };

  // Loading states
  if (!isConfigured || statusLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">GitHub Repositories</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Not linked
  if (!statusData?.linked) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">GitHub Repositories</h2>
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            Connect your GitHub account to monitor repositories and receive post notifications.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">GitHub Repositories</h2>
          <p className="text-sm text-gray-600 mt-1">
            Connected as <span className="font-medium">@{statusData.username}</span>
          </p>
        </div>
        <button
          onClick={() => refetchRepos()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {reposLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : reposData?.repositories?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No repositories found
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Select repositories to monitor. When you push code, we'll generate posts automatically.
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
            {reposData?.repositories?.map((repo: { fullName: string; isPrivate: boolean }) => {
           const isSelected = selectedRepos.includes(repo.fullName);
           return (
             <button
               key={repo.fullName}
               onClick={() => handleToggleRepo(repo.fullName)}
               className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                 isSelected
                   ? 'border-blue-500 bg-blue-50'
                   : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
               }`}
             >
              {isSelected ? (
                <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
              <span className="text-left font-mono text-sm flex-1">{repo.fullName}</span>
              {repo.isPrivate && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  Private
                </span>
              )}
             </button>
             );
           })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={updateReposMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {updateReposMutation.isPending ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Selection'
              )}
            </button>

            <button
              onClick={handleRegisterWebhooks}
              disabled={registerWebhooksMutation.isPending || selectedRepos.length === 0}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              {registerWebhooksMutation.isPending ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                'Register Webhooks'
              )}
            </button>
          </div>

          {selectedRepos.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{selectedRepos.length}</span> repository
                {selectedRepos.length === 1 ? '' : 'ies'} selected
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}