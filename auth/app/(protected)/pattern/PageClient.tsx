"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { Upload, TrendingUp, Loader2, Info } from 'lucide-react';
import TrainingTips from '@/components/TrainingTips';

export default function PatternClient() {
  const [posts, setPosts] = useState('');
  const queryClient = useQueryClient();
  const { api, isConfigured } = useBackendApi();

  const { data: profile } = useQuery({
    queryKey: ['pattern-profile'],
    queryFn: async () => {
      const { data } = await api.get('/pattern/profile');
      return data;
    },
    enabled: isConfigured,
  });

  const { data: stats } = useQuery({
    queryKey: ['pattern-stats'],
    queryFn: async () => {
      const { data } = await api.get('/pattern/stats');
      return data;
    },
    enabled: isConfigured,
  });

  const importMutation = useMutation({
    mutationFn: async (posts: string[]) => {
      const { data } = await api.post('/pattern/import', { posts });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pattern-profile'] });
      queryClient.invalidateQueries({ queryKey: ['pattern-stats'] });
      setPosts('');
      alert('Pattern learned successfully!');
    },
  });

  const handleImport = () => {
    const postArray = posts.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (postArray.length < 5) {
      alert('Please provide at least 5 posts (one per line)');
      return;
    }
    importMutation.mutate(postArray);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Writing Pattern</h1>
      <p className="text-gray-600 mb-8">Train the AI to write exactly like you</p>

      {stats?.hasPattern && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow-md rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Posts Analyzed</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalPostsAnalyzed}</p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgRating}⭐</p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Acceptance Rate</p>
            <p className="text-2xl font-bold text-gray-900">{stats.acceptanceRate}</p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Sentence Length</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgSentenceLength}w</p>
          </div>
        </div>
      )}

      <TrainingTips />

      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Import Your Posts</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">How to get your past posts:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to your X/Twitter profile</li>
              <li>Copy 10-20 of your recent posts</li>
              <li>Paste them below (one per line)</li>
              <li>Click "Learn Pattern"</li>
            </ol>
          </div>
        </div>

        <textarea
          value={posts}
          onChange={(e) => setPosts(e.target.value)}
          placeholder="Paste your posts here, one per line..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
        />

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            {posts.split('\n').filter(p => p.trim().length > 0).length} posts
          </span>
          <button
            onClick={handleImport}
            disabled={importMutation.isPending || posts.split('\n').filter(p => p.trim().length > 0).length < 5}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Learning...
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                Learn Pattern
              </>
            )}
          </button>
        </div>
      </div>

      {profile?.exists && (
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Writing Pattern</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Sentence Length</p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.pattern.avgSentenceLength.toFixed(1)} words
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Formality Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(profile.pattern.formalityScore / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{profile.pattern.formalityScore.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}