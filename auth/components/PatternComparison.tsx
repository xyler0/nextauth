import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Props {
  original: string;
  generated: string;
  pattern: {
    avgSentenceLength: number;
    formalityScore: number;
  };
}

export default function PatternComparison({ original, generated, pattern }: Props) {
  const analyzeText = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgLength = sentences.length > 0 ? words.length / sentences.length : 0;
    
    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      avgSentenceLength: avgLength,
    };
  };

  const originalStats = analyzeText(original);
  const generatedStats = analyzeText(generated);

  const matchesPattern = (value: number, target: number, tolerance: number) => {
    return Math.abs(value - target) <= tolerance;
  };

  const lengthMatch = matchesPattern(
    generatedStats.avgSentenceLength,
    pattern.avgSentenceLength,
    3
  );

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Pattern Match Analysis</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Sentence Length</p>
            <p className="text-xs text-gray-500">
              Target: {pattern.avgSentenceLength.toFixed(1)} words
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lengthMatch ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-yellow-600" size={20} />
            )}
            <span className="text-sm font-semibold">
              {generatedStats.avgSentenceLength.toFixed(1)}w
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Length</p>
            <p className="text-xs text-gray-500">
              Original: {originalStats.wordCount} words
            </p>
          </div>
          <div className="flex items-center gap-2">
            {generatedStats.wordCount < originalStats.wordCount ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <XCircle className="text-red-600" size={20} />
            )}
            <span className="text-sm font-semibold">
              {generatedStats.wordCount}w ({Math.round((generatedStats.wordCount / originalStats.wordCount) * 100)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}