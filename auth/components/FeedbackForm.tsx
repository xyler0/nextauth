"use client";

import { useState } from 'react';
import { Star, Send, Loader2, AlertCircle } from 'lucide-react';

interface FeedbackFormProps {
  originalText: string;
  generatedText: string;
  editedText?: string;
  onSubmit: (feedback: {
    originalText: string;
    generatedText: string;
    editedText?: string;
    rating: number;
    feedback?: string;
    accepted: boolean;
  }) => Promise<void>;
  onClose?: () => void;
}

// Save this as: components/FeedbackForm.tsx

export default function FeedbackForm({
  originalText,
  generatedText,
  editedText,
  onSubmit,
  onClose
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        originalText,
        generatedText,
        editedText,
        rating,
        feedback: feedbackText.trim() || undefined,
        accepted,
      });
      
      // Reset form
      setRating(0);
      setFeedbackText('');
      setAccepted(false);
      
      if (onClose) onClose();
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Rate This Generated Post
        </h3>
        <p className="text-sm text-gray-600">
          Your feedback helps improve the AI's understanding of your writing style
        </p>
      </div>

      {/* Post Preview */}
      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Original Text
          </p>
          <p className="text-sm text-gray-700">{originalText}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-semibold text-blue-600 uppercase mb-2">
            AI Generated
          </p>
          <p className="text-sm text-gray-900">{generatedText}</p>
        </div>

        {editedText && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs font-semibold text-green-600 uppercase mb-2">
              Your Edit
            </p>
            <p className="text-sm text-gray-900">{editedText}</p>
          </div>
        )}
      </div>

      {/* Star Rating */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          How well did this match your style? *
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={`${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                } transition-colors`}
              />
            </button>
          ))}
          <span className="ml-3 text-sm font-medium text-gray-700">
            {rating === 0 && 'Select rating'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </span>
        </div>
      </div>

      {/* Text Feedback */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Additional Feedback (Optional)
        </label>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="What should the AI improve? Be specific about tone, word choice, length, etc."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          rows={4}
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            Help the AI learn your style better with specific feedback
          </p>
          <span className="text-xs text-gray-400">
            {feedbackText.length}/500
          </span>
        </div>
      </div>

      {/* Accepted Checkbox */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            I accepted and posted this version
            <span className="text-xs text-gray-500 block">
              Checking this helps the AI learn what works
            </span>
          </span>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Submitting...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Feedback
            </>
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-900 mb-2">💡 Tips for better feedback:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Be specific: "Too formal" vs "Use more casual language like I normally do"</li>
          <li>• Mention patterns: "I always start with action verbs" or "I never use emojis"</li>
          <li>• Note length preferences: "Too long" vs "Keep it under 15 words"</li>
        </ul>
      </div>
    </div>
  );
}