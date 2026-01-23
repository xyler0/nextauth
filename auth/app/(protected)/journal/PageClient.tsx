"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { FileText, Send, Loader2 } from 'lucide-react';

export default function JournalClient() {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();
  const { api, isConfigured } = useBackendApi();

  const { data: entries } = useQuery({
    queryKey: ['journal'],
    queryFn: async () => {
      const { data } = await api.get('/journal');
      return data;
    },
    enabled: isConfigured,
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post('/journal', { content });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setContent('');
      alert('Journal entry created!');
    },
  });

  const processAndPostMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { data } = await api.post('/journal/process-and-post', { entryId });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      alert(`Posted ${data.results.length} segments!`);
    },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Journal</h1>

      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">New Entry</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts... (minimum 50 characters)"
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">{content.length} characters</span>
          <button
            onClick={() => createMutation.mutate(content)}
            disabled={content.length < 50 || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving...
              </>
            ) : (
              <>
                <FileText size={16} />
                Save Entry
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Your Entries</h2>
        {entries && entries.length > 0 ? (
          entries.map((entry: any) => (
            <div key={entry.id} className="bg-white shadow-md rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  entry.processed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {entry.processed ? 'Processed' : 'New'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{entry.content}</p>
              {!entry.processed && (
                <button
                  onClick={() => processAndPostMutation.mutate(entry.id)}
                  disabled={processAndPostMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {processAndPostMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Process & Post
                    </>
                  )}
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-8">
            No journal entries yet. Create your first one above!
          </p>
        )}
      </div>
    </div>
  );
}