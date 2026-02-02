"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { Send, Loader2, Trash2, Edit2, X, CheckCircle } from 'lucide-react';
import FeedbackForm from '@/components/FeedbackForm';

export default function PostsClient() {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [postError, setPostError] = useState('');
  
  const queryClient = useQueryClient();
  const { api, isConfigured } = useBackendApi();

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.get('/posts');
      return data;
    },
    enabled: isConfigured,
  });

  // Step 1: Generate preview (tone-enforced version)
  const generatePreviewMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post('/tone/preview', { text }); // New endpoint
      return data;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.transformed);
      setEditedContent(data.transformed);
      setShowPreview(true);
      setPostError('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to generate preview';
      setPostError(message);
    },
  });

  // Step 2: Actually post to X
  const postToXMutation = useMutation({
    mutationFn: async (finalContent: string) => {
      const { data } = await api.post('/posts/manual', { 
        content: finalContent,
        originalContent: content, // Send both for tracking
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowPreview(false);
      setShowFeedback(true);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to post';
      
      // Handle specific error cases
      if (message.includes('duplicate') || message.includes('Duplicate')) {
        setPostError('⚠️ This content has already been posted. Please create something new.');
      } else if (message.includes('Daily limit')) {
        setPostError('⚠️ You\'ve reached your daily post limit. Try again tomorrow!');
      } else if (message.includes('rate limit')) {
        setPostError('⚠️ Posting too quickly. Please wait a moment and try again.');
      } else {
        setPostError(message);
      }
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
      setContent('');
      setGeneratedContent('');
      setEditedContent('');
      setIsEditing(false);
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

  const handleGeneratePreview = () => {
    setPostError('');
    generatePreviewMutation.mutate(content);
  };

  const handlePost = () => {
    const finalContent = isEditing ? editedContent : generatedContent;
    postToXMutation.mutate(finalContent);
  };

  const handleCancel = () => {
    setShowPreview(false);
    setIsEditing(false);
    setGeneratedContent('');
    setEditedContent('');
    setPostError('');
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
    await feedbackMutation.mutateAsync({
      ...feedbackData,
      originalText: content,
      generatedText: generatedContent,
      editedText: isEditing ? editedContent : undefined,
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Posts</h1>
      <p className="text-gray-600 mb-8">Create and manage your posts</p>

      {/* Error Display */}
      {postError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
              <X size={14} className="text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Unable to post</p>
            <p className="text-sm text-red-700 mt-1">{postError}</p>
          </div>
          <button
            onClick={() => setPostError('')}
            className="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Create Post Card */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Manual Post</h2>
        <p className="text-sm text-gray-600 mb-4">
          Write your raw content below. AI will transform it to match your writing style, then you can review before posting.
        </p>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post... (AI will refine it to match your style)"
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          disabled={showPreview}
        />
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm">
            <span className={content.length > 500 ? 'text-red-600 font-medium' : 'text-gray-500'}>
              {content.length}
            </span>
            <span className="text-gray-400">/500 characters</span>
          </div>
          <button
            onClick={handleGeneratePreview}
            disabled={content.length < 10 || content.length > 500 || generatePreviewMutation.isPending || showPreview}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generatePreviewMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Generating...
              </>
            ) : (
              <>
                <Edit2 size={16} />
                Generate Preview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview & Edit Card */}
      {showPreview && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Review Your Post</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Original vs Generated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Original
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
              <div className="mt-2 text-xs text-gray-500">
                {content.length} characters
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-300 ring-2 ring-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
                AI Refined {isEditing && '(Editing)'}
              </p>
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  rows={4}
                />
              ) : (
                <p className="text-sm text-gray-900 leading-relaxed">{generatedContent}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {(isEditing ? editedContent : generatedContent).length}/280 characters
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Edit2 size={12} />
                  {isEditing ? 'Stop Editing' : 'Edit'}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={postToXMutation.isPending || (isEditing && editedContent.length > 280)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {postToXMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Posting to X...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Post to X
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            You'll be able to provide feedback after posting
          </p>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="mb-8">
          <FeedbackForm
            originalText={content}
            generatedText={generatedContent}
            editedText={isEditing ? editedContent : undefined}
            onSubmit={handleFeedbackSubmit}
            onClose={() => {
              setShowFeedback(false);
              setContent('');
              setGeneratedContent('');
              setEditedContent('');
              setIsEditing(false);
            }}
          />
        </div>
      )}

      {/* Post History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Post History</h2>
        
        {postsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : posts && posts.length > 0 ? (
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
                        if (confirm('Delete this post from history? (This won\'t delete it from X)')) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete from history"
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
            <Send size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No posts yet</p>
            <p className="text-sm text-gray-400">Create your first post above!</p>
          </div>
        )}
      </div>
    </div>
  );
}