"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendApi } from '@/hooks/useBackendApi';
import { Send, Loader2, Eye, CheckCircle, Edit2 } from 'lucide-react';

interface Draft {
  text: string;
  selected: boolean;
  edited?: string;
}

export default function JournalClient() {
  const [content, setContent] = useState('');
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  
  const queryClient = useQueryClient();
  const { api, isConfigured } = useBackendApi();

  const { data: entries } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const { data } = await api.get('/journal');
      return data;
    },
    enabled: isConfigured,
  });

  // Create journal entry
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post('/journal', { content });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setCurrentEntryId(data.id);
      setContent('');
      // Auto-generate drafts
      generateDraftsMutation.mutate(data.id);
    },
  });

  // Generate drafts from journal entry
  const generateDraftsMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { data } = await api.post(`/journal/${entryId}/generate-draft`);
      return data;
    },
    onSuccess: (data) => {
      // data.drafts is an array of AI-generated posts
      setDrafts(data.drafts.map((text: string) => ({ 
        text, 
        selected: false,
        edited: undefined 
      })));
      setShowDrafts(true);
    },
  });

  // Approve and post selected drafts
  const approveMutation = useMutation({
    mutationFn: async ({ entryId, selectedDrafts }: { entryId: string; selectedDrafts: string[] }) => {
      const { data } = await api.post(`/journal/${entryId}/approve-and-post`, {
        selectedDrafts,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowDrafts(false);
      setDrafts([]);
      setCurrentEntryId(null);
      alert('Posts published successfully!');
    },
  });

  const toggleDraftSelection = (index: number) => {
    setDrafts(drafts.map((draft, i) => 
      i === index ? { ...draft, selected: !draft.selected } : draft
    ));
  };

  const editDraft = (index: number, newText: string) => {
    setDrafts(drafts.map((draft, i) => 
      i === index ? { ...draft, edited: newText } : draft
    ));
  };

  const handleApprove = () => {
    if (!currentEntryId) return;
    
    const selectedDrafts = drafts
      .filter(d => d.selected)
      .map(d => d.edited || d.text);
    
    if (selectedDrafts.length === 0) {
      alert('Please select at least one draft to post');
      return;
    }
    
    approveMutation.mutate({ entryId: currentEntryId, selectedDrafts });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal</h1>
      <p className="text-gray-600 mb-8">Write your thoughts, AI will create posts</p>

      {/* Create Journal Entry */}
      <div className="bg-white shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">New Journal Entry</h2>
        <p className="text-sm text-gray-600 mb-4">
          Write freely about your day, projects, or learnings. The AI will extract the most meaningful parts for posts.
        </p>
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Today I worked on..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
        />
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            {content.length} characters (min 50)
          </span>
          <button
            onClick={() => createMutation.mutate(content)}
            disabled={content.length < 50 || createMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Processing...
              </>
            ) : (
              <>
                <Eye size={16} />
                Generate Drafts
              </>
            )}
          </button>
        </div>
      </div>

      {/* Draft Review */}
      {showDrafts && drafts.length > 0 && (
        <div className="bg-white shadow-md rounded-xl p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Review Generated Drafts</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select the posts you want to publish. You can edit them before posting.
          </p>
          
          <div className="space-y-4 mb-6">
            {drafts.map((draft, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 transition-all ${
                  draft.selected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={draft.selected}
                    onChange={() => toggleDraftSelection(index)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500">
                        Draft {index + 1}
                      </span>
                      {draft.edited && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                          <Edit2 size={10} />
                          Edited
                        </span>
                      )}
                    </div>
                    
                    {draft.selected ? (
                      <textarea
                        value={draft.edited || draft.text}
                        onChange={(e) => editDraft(index, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900 text-sm">{draft.text}</p>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {(draft.edited || draft.text).length}/280 characters
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDrafts(false);
                setDrafts([]);
                setCurrentEntryId(null);
              }}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending || !drafts.some(d => d.selected)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Publish Selected ({drafts.filter(d => d.selected).length})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Entry History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Entry History</h2>
        
        {entries && entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry: any) => (
              <div key={entry.id} className="bg-white shadow-md rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    entry.processed 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {entry.processed ? 'Processed' : 'Pending'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-900 text-sm whitespace-pre-wrap line-clamp-3">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500 mb-2">No journal entries yet</p>
            <p className="text-sm text-gray-400">Start writing above!</p>
          </div>
        )}
      </div>
    </div>
  );
}