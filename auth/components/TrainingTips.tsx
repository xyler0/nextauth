import { Lightbulb } from 'lucide-react';

export default function TrainingTips() {
  return (
    <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <div className="flex items-start gap-3">
        <Lightbulb className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Tips for Better Results</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Import 10-20 posts for best pattern detection</li>
            <li>• Rate every generated post to improve accuracy</li>
            <li>• Edit posts before accepting to teach the AI</li>
            <li>• More data = more accurate pattern matching</li>
          </ul>
        </div>
      </div>
    </div>
  );
}