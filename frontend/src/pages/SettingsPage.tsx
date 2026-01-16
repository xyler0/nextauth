import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Link as LinkIcon, Unlink } from 'lucide-react';
import { SiX, SiGithub } from 'react-icons/si';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: connections } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data } = await api.get('/user/connections');
      return data;
    },
  });

  const { data: repos } = useQuery({
    queryKey: ['repos'],
    queryFn: async () => {
      const { data } = await api.get('/user/github/repositories');
      return data;
    },
    enabled: connections?.github.linked,
  });

  const unlinkMutation = useMutation({
    mutationFn: async (provider: 'github' | 'twitter') => {
      await api.delete(`/user/link/${provider}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      alert('Account unlinked!');
    },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Connected Accounts */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Connected Accounts</h2>
        
        <div className="space-y-4">
          {/* GitHub */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <SiGithub size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">GitHub</h3>
                {connections?.github.linked ? (
                  <p className="text-sm text-gray-600">
                    Connected as @{connections.github.username}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
            </div>
            
            {connections?.github.linked ? (
              <button
                onClick={() => unlinkMutation.mutate('github')}
                disabled={unlinkMutation.isPending}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Unlink size={16} />
                Unlink
              </button>
            ) : (
              <a
                href={`${API_URL}/user/link/github`}
                className="btn btn-primary flex items-center gap-2"
              >
                <LinkIcon size={16} />
                Connect
              </a>
            )}
          </div>

          {/* Twitter */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                <SiX size={24} className="text-sky-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Twitter</h3>
                {connections?.twitter.linked ? (
                  <p className="text-sm text-gray-600">
                    Connected as {connections.twitter.username}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
            </div>
            
            {connections?.twitter.linked ? (
              <button
                onClick={() => unlinkMutation.mutate('twitter')}
                disabled={unlinkMutation.isPending}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Unlink size={16} />
                Unlink
              </button>
            ) : (
              <a
                href={`${API_URL}/user/link/twitter`}
                className="btn bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-2"
              >
                <LinkIcon size={16} />
                Connect
              </a>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Repositories */}
      {connections?.github.linked && repos && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Monitored Repositories
          </h2>
          
          {repos.repositories.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {repos.repositories.map((repo: string) => (
                <label
                  key={repo}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={repos.monitored.includes(repo)}
                    className="w-4 h-4 text-primary-600"
                    readOnly
                  />
                  <span className="text-gray-700">{repo}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No repositories found
            </p>
          )}
        </div>
      )}
    </div>
  );
}