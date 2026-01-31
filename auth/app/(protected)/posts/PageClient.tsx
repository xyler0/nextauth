"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { Send, Loader2, Trash2 } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';

export default function PostsClient() {
  const [content, setContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const queryClient = useQueryClient();
  const { api, isConfigured } = useBackendApi();
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<{
    original: string;
    generated: string;
  } | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      // Show feedback form with generated content
      setLastGenerated({ 
        original: variables, 
        generated: data.content || variables 
      });
      setEditedContent(data.content || variables);
      setShowFeedback(true);
      setContent('');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create post');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (feedback: any) => {
      const { data } = await api.post('/pattern/feedback', feedback);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pattern-stats'] });
      setShowFeedback(false);
      setLastGenerated(null);
      setEditedContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleFeedbackSubmit = async (feedbackData: {
    originalText: string;
    generatedText: string;
    editedText?: string;
    rating: number;
    feedback?: string;
    accepted: boolean;
  }) => {
    await feedbackMutation.mutateAsync(feedbackData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Posts</h1>
      <p className="text-gray-600 mb-8">Create and manage your posts</p>

      {/* Create Post Card */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Manual Post</h2>
        <p className="text-sm text-gray-600 mb-4">
          Write your raw content below. The AI will transform it to match your writing style.
        </p>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post... (will be tone-enforced and matched to your style)"
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            <span className={content.length > 280 ? 'text-red-600' : ''}>
              {content.length}
            </span>
            /280 characters
          </div>
          <button
            onClick={() => createMutation.mutate(content)}
            disabled={content.length < 10 || content.length > 280 || createMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Feedback Modal/Card */}
      {showFeedback && lastGenerated && (
        <div className="mb-8">
          <FeedbackForm
            originalText={lastGenerated.original}
            generatedText={lastGenerated.generated}
            editedText={editedContent !== lastGenerated.generated ? editedContent : undefined}
            onSubmit={handleFeedbackSubmit}
            onClose={() => {
              setShowFeedback(false);
              setLastGenerated(null);
              setEditedContent('');
            }}
          />
        </div>
      )}

      {/* Post History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Post History</h2>
        
        {posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <div key={post.id} className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    post.source === 'GITHUB' 
                      ? 'bg-gray-100 text-gray-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {post.source}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Delete this post?')) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-900 mb-4 leading-relaxed">{post.content}</p>
                
                <div className="flex items-center gap-4 text-sm border-t pt-3">
                  {post.posted ? (
                    <>
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Posted
                      </span>
                      {post.postedAt && (
                        <span className="text-gray-500">
                          {new Date(post.postedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 mb-2">No posts yet</p>
            <p className="text-sm text-gray-400">Create your first post above!</p>
          </div>
        )}
      </div>
    </div>
  );
}