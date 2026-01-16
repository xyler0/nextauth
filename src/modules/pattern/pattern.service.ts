import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PatternAnalyzerService } from './pattern-analyzer.service';

@Injectable()
export class PatternService {
  private readonly logger = new Logger(PatternService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyzer: PatternAnalyzerService,
  ) {}

  async learnFromText(userId: string, text: string): Promise<void> {
    this.logger.log(`Learning from text for user ${userId}`);

    const analysis = this.analyzer.analyzeText(text);

    // Get or create pattern
    let pattern = await this.prisma.writingPattern.findUnique({
      where: { userId },
    });

    if (!pattern) {
      // Create initial pattern
      pattern = await this.prisma.writingPattern.create({
        data: {
          userId,
          avgSentenceLength: analysis.avgSentenceLength,
          avgWordsPerSentence: analysis.avgSentenceLength,
          maxSentenceLength: Math.max(...analysis.sentences.map(s => s.length)),
          minSentenceLength: Math.min(...analysis.sentences.map(s => s.length)),
          commonWords: this.analyzer.extractTopWords(analysis.wordFrequency),
          avoidWords: [],
          technicalTerms: [],
          usesEmojis: analysis.hasEmojis,
          usesHashtags: analysis.hasHashtags,
          usesAbbreviations: analysis.hasAbbreviations,
          formalityScore: this.analyzer.calculateFormalityScore(analysis),
          commaFrequency: analysis.punctuationStats.commas / analysis.sentences.length,
          periodFrequency: analysis.punctuationStats.periods / analysis.sentences.length,
          dashFrequency: analysis.punctuationStats.dashes / analysis.sentences.length,
          ellipsisFrequency: analysis.punctuationStats.ellipsis / analysis.sentences.length,
          commonStarters: this.analyzer.extractCommonStarters(analysis.commonStarters),
          examplePosts: [text],
          totalPostsAnalyzed: 1,
        },
      });
    } else {
      // Update existing pattern (running average)
      const n = pattern.totalPostsAnalyzed;
      const updatedAvgSentenceLength = 
        (pattern.avgSentenceLength * n + analysis.avgSentenceLength) / (n + 1);

      await this.prisma.writingPattern.update({
        where: { userId },
        data: {
          avgSentenceLength: updatedAvgSentenceLength,
          avgWordsPerSentence: updatedAvgSentenceLength,
          maxSentenceLength: Math.max(
            pattern.maxSentenceLength,
            Math.max(...analysis.sentences.map(s => s.length))
          ),
          minSentenceLength: Math.min(
            pattern.minSentenceLength,
            Math.min(...analysis.sentences.map(s => s.length))
          ),
          formalityScore: 
            (pattern.formalityScore * n + this.analyzer.calculateFormalityScore(analysis)) / (n + 1),
          totalPostsAnalyzed: n + 1,
          // Append example if we have < 20
          examplePosts: Array.isArray(pattern.examplePosts)
            ? [...pattern.examplePosts, text].slice(-20)
            : [text],
        },
      });
    }

    this.logger.log(`Pattern updated for user ${userId}`);
  }

  async getPattern(userId: string) {
    return this.prisma.writingPattern.findUnique({
      where: { userId },
    });
  }

  async generatePersonalizedPrompt(userId: string): Promise<string> {
    const pattern = await this.getPattern(userId);

    if (!pattern) {
      // Fallback to generic tone
      return `Transform the following text to be clear, concise, and direct.`;
    }

    const examples = Array.isArray(pattern.examplePosts) 
      ? pattern.examplePosts.slice(0, 5) 
      : [];

    return `You are writing in a specific person's style. Here are their writing characteristics:

WRITING PATTERN:
- Average sentence length: ${Math.round(pattern.avgSentenceLength)} words
- Sentence length range: ${pattern.minSentenceLength}-${pattern.maxSentenceLength} words
- Formality level: ${pattern.formalityScore.toFixed(1)}/10
- Uses emojis: ${pattern.usesEmojis ? 'Yes' : 'No'}
- Uses hashtags: ${pattern.usesHashtags ? 'Yes' : 'No'}
- Common sentence starters: ${Array.isArray(pattern.commonStarters) ? pattern.commonStarters.join(', ') : ''}

EXAMPLE POSTS FROM THIS PERSON:
${examples.map((post, i) => `${i + 1}. ${post}`).join('\n')}

INSTRUCTIONS:
1. Match their sentence length (${Math.round(pattern.avgSentenceLength)} words per sentence)
2. Use their sentence starters when appropriate
3. Match their formality level (${pattern.formalityScore < 5 ? 'casual' : pattern.formalityScore > 7 ? 'formal' : 'neutral'})
4. ${pattern.usesEmojis ? 'Include' : 'Avoid'} emojis
5. ${pattern.usesHashtags ? 'Use' : 'Avoid'} hashtags
6. Keep total length under 280 characters

Transform the input to match this person's writing style exactly.`;
  }
}