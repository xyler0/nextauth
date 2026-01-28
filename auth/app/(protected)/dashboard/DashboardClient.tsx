"use client";

import { useQuery } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { Activity, GitBranch, TrendingUp } from 'lucide-react';
import { SiX } from 'react-icons/si';
import { Spinner } from '@/components/ui/spinner';

interface DashboardClientProps {
  userId: string;
}

export default function DashboardClient({ userId }: DashboardClientProps) {
  const { api, isConfigured } = useBackendApi();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/posts/stats');
      return data;
    },
    enabled: isConfigured,
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data } = await api.get('/user/connections');
      return data;
    },
    enabled: isConfigured,
  });

  const { data: recentPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['recentPosts'],
    queryFn: async () => {
      const { data } = await api.get('/posts?limit=5');
      return data;
    },
    enabled: isConfigured,
  });

  if (!isConfigured || statsLoading || connectionsLoading || postsLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Spinner className="h-12 w-12" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Posts</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.todayCount || 0}/{stats?.maxPerDay || 3}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">GitHub</p>
              <p className="text-lg font-semibold text-gray-900">
                GitHub: {connections?.github?.linked ? (connections?.github?.username || 'Connected') : 'Not connected'}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <GitBranch className="text-gray-700" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Twitter</p>
              <p className="text-lg font-semibold text-gray-900">
                Twitter: {connections?.twitter?.linked ? (connections?.twitter?.username || 'Connected') : 'Not connected'}
              </p>
            </div>
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
              <SiX className="text-sky-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
          <TrendingUp className="text-gray-400" size={20} />
        </div>

        {recentPosts && recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.map((post: any) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    post.source === 'GITHUB'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {post.source}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-900">{post.content}</p>
                <div className="mt-2 flex items-center gap-2">
                  {post.posted ? (
                    <span className="text-xs text-green-600">✓ Posted</span>
                  ) : (
                    <span className="text-xs text-gray-500">⏳ Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No posts yet. Create your first post!
          </p>
        )}
      </div>
    </div>
  );
}