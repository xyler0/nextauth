"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { Upload, TrendingUp, Loader2, Info, Plus, X, Lightbulb } from 'lucide-react';
import TrainingTips from '@/components/TrainingTips';

export default function PatternClient() {
  const [posts, setPosts] = useState<string[]>(['']);
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
      setPosts(['']);
      alert('Pattern learned successfully!');
    },
  });

  const addPost = () => {
    setPosts([...posts, '']);
  };

  const removePost = (index: number) => {
    setPosts(posts.filter((_, i) => i !== index));
  };

  const updatePost = (index: number, value: string) => {
    const newPosts = [...posts];
    newPosts[index] = value;
    setPosts(newPosts);
  };

  const handleImport = () => {
    const validPosts = posts.map(p => p.trim()).filter(p => p.length > 0);
    if (validPosts.length < 5) {
      alert('Please provide at least 5 posts');
      return;
    }
    importMutation.mutate(validPosts);
  };

  const validPostCount = posts.filter(p => p.trim().length > 0).length;

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

      {/* Import Section */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={20} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Import Your Posts</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">How to import your posts:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Go to your X/Twitter profile</li>
              <li>Copy your recent posts</li>
              <li>Paste each post in a separate box below</li>
              <li>Click "Add Post" to add more posts</li>
              <li>Click "Learn Pattern" when done (minimum 5 posts)</li>
            </ol>
          </div>
        </div>

        {/* Post Input Boxes */}
        <div className="space-y-4 mb-4">
          {posts.map((post, index) => (
            <div key={index} className="relative">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Post {index + 1}
                    </span>
                    {posts.length > 1 && (
                      <button
                        onClick={() => removePost(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Remove post"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={post}
                    onChange={(e) => updatePost(index, e.target.value)}
                    placeholder="Paste your post here..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    rows={3}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {post.trim().length} characters
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Post Button */}
        <button
          onClick={addPost}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors mb-4"
        >
          <Plus size={20} />
          <span className="font-semibold">Add Another Post</span>
        </button>

        {/* Action Bar */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm">
            <span className={`font-semibold ${validPostCount >= 5 ? 'text-green-600' : 'text-gray-500'}`}>
              {validPostCount} posts
            </span>
            <span className="text-gray-500"> (minimum 5 required)</span>
          </div>
          <button
            onClick={handleImport}
            disabled={importMutation.isPending || validPostCount < 5}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Pattern Profile Display */}
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
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(profile.pattern.formalityScore / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{profile.pattern.formalityScore.toFixed(1)}/10</span>
              </div>
            </div>
            
            {profile.pattern.commonStarters && profile.pattern.commonStarters.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Common Sentence Starters</p>
                <div className="flex flex-wrap gap-2">
                  {profile.pattern.commonStarters.slice(0, 5).map((starter: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {starter}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}