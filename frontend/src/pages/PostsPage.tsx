import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Send, Loader2, Trash2 } from 'lucide-react';

export default function PostsPage() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.get('/posts');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post('/posts/manual', { content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setContent('');
      alert('Post created!');
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Posts</h1>

      {/* Manual Post */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Manual Post</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post... (will be tone-enforced)"
          maxLength={280}
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            {content.length}/280 characters
          </span>
          <button
            onClick={() => createMutation.mutate(content)}
            disabled={content.length < 10 || createMutation.isPending}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
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

      {/* Posts History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Post History</h2>
        
        {posts && posts.length > 0 ? (
          posts.map((post: any) => (
            <div key={post.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  post.source === 'GITHUB'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {post.source}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(post.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-900 mb-3">{post.content}</p>
              
              <div className="flex items-center gap-4 text-sm">
                {post.posted ? (
                  <>
                    <span className="text-green-600 flex items-center gap-1">
                      ✓ Posted
                    </span>
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
          <p className="text-center text-gray-500 py-8">
            No posts yet. Create your first post above!
          </p>
        )}
      </div>
    </div>
  );
}