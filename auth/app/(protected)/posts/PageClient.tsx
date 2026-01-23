"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { Send, Loader2, Trash2, Star } from 'lucide-react';

export default function PostsClient() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const { api, isConfigured } = useBackendApi();
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<{original: string, generated: string} | null>(null);

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.get('/posts');
      return data;
    },
    enabled: isConfigured,
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post('/posts/manual', { content });
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setLastGenerated({ original: variables, generated: data.content || variables });
      setShowFeedback(true);
      setContent('');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (feedback: any) => {
      const { data } = await api.post('/pattern/feedback', feedback);
      return data;
    },
    onSuccess: () => {
      setShowFeedback(false);
      setLastGenerated(null);
      alert('Feedback submitted!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const submitFeedback = (rating: number, accepted: boolean) => {
    if (!lastGenerated) return;
    feedbackMutation.mutate({
      originalText: lastGenerated.original,
      generatedText: lastGenerated.generated,
      rating,
      accepted,
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Posts</h1>

      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Manual Post</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post... (will be tone-enforced)"
          maxLength={280}
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">{content.length}/280 characters</span>
          <button
            onClick={() => createMutation.mutate(content)}
            disabled={content.length < 10 || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Posting...
              </>
            ) : (
              <>
                <Send size={16} />
                Post Now
              </>
            )}
          </button>
        </div>
      </div>

      {showFeedback && lastGenerated && (
        <div className="bg-white shadow-md rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">How was the generated post?</h3>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Generated:</p>
            <p className="text-gray-900">{lastGenerated.generated}</p>
          </div>
          <p className="text-sm text-gray-600 mb-3">Rate this post:</p>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => submitFeedback(rating, rating >= 3)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Star size={16} className={rating >= 3 ? 'fill-yellow-400 text-yellow-400' : ''} />
                {rating}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFeedback(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip feedback
          </button>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Post History</h2>
        {posts && posts.length > 0 ? (
          posts.map((post: any) => (
            <div key={post.id} className="bg-white shadow-md rounded-xl p-6">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  post.source === 'GITHUB' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {post.source}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(post.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-gray-900 mb-3">{post.content}</p>
              <div className="flex items-center gap-4 text-sm">
                {post.posted ? (
                  <>
                    <span className="text-green-600">✓ Posted</span>
                    {post.postedAt && (
                      <span className="text-gray-500">
                        {new Date(post.postedAt).toLocaleString()}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">Pending</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">No posts yet. Create your first post above!</p>
        )}
      </div>
    </div>
  );
}