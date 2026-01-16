import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PatternService } from '../pattern/pattern.service';
import { DEFAULT_TONE_RULES } from './constants/tone-rules.constant';
import { TONE_SYSTEM_PROMPT } from './constants/tone-prompt.constant';
import { ToneRules } from './interfaces/tone-rules.interface';

@Injectable()
export class ToneService {
  private readonly logger = new Logger(ToneService.name);
  private readonly openai: OpenAI;
  private readonly rules: ToneRules;
  private readonly model: string;
  private readonly temperature: number;
  private readonly testMode: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly patternService: PatternService,
  ) {
    this.testMode = this.config.get<string>('NODE_ENV') === 'test';
    
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey && !this.testMode) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.openai = new OpenAI({ apiKey: apiKey || 'test-key' });
    this.rules = DEFAULT_TONE_RULES;
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.temperature = this.config.get<number>('OPENAI_TEMPERATURE', 0.3);
  }

  async applyTone(rawText: string, userId?: string): Promise<string> {
    this.logger.debug(`Applying tone to: ${rawText.substring(0, 50)}...`);

    // Pre-validation
    this.validateInput(rawText);

    // In test mode, use simple transformation
    if (this.testMode) {
      const simplified = this.simpleTransform(rawText);
      this.enforceRules(simplified);
      return simplified;
    }

    // Get personalized prompt if user has pattern
    let systemPrompt = TONE_SYSTEM_PROMPT;
    if (userId) {
      try {
        const personalizedPrompt = await this.patternService.generatePersonalizedPrompt(userId);
        if (personalizedPrompt) {
          systemPrompt = personalizedPrompt;
          this.logger.debug('Using personalized writing pattern');
        }
      } catch (error) {
        this.logger.warn('Failed to get personalized prompt, using default', error);
      }
    }

    // Transform via LLM
    const transformed = await this.transform(rawText, systemPrompt);

    // Post-validation
    this.enforceRules(transformed);

    this.logger.log(`Tone applied successfully`);
    return transformed;
  }

  private async transform(text: string, systemPrompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: this.temperature,
        max_tokens: 100,
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return content;
    } catch (error) {
      this.logger.error('OpenAI transformation failed', error);
      throw new BadRequestException('Failed to apply tone transformation');
    }
  }



   private simpleTransform(text: string): string {
    // Simple test transformation: remove fluff and truncate
    return text
      .replace(/\b(excited|thrilled|just|really|very|I think|in my opinion)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }

  private validateInput(text: string): void {
    if (!text || text.trim().length < 10) {
      throw new BadRequestException('Input too short for tone transformation');
    }

    if (text.length > 5000) {
      throw new BadRequestException('Input too long (max 5000 characters)');
    }
  }

  private enforceRules(text: string): void {
  // Rule 1: X character limit (GLOBAL)
  if (text.length > 280) {
    throw new BadRequestException(
      `Exceeds X character limit: ${text.length} (max: 280)`
    );
  }

  // Rule 2: Banned phrases
  const lowerText = text.toLowerCase();
  for (const phrase of this.rules.bannedPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      throw new BadRequestException(`Contains banned phrase: "${phrase}"`);
    }
  }

  // Rule 3: Sentence count
  const sentences = text.split(/[.!]/).filter((s) => s.trim().length > 0);
  if (sentences.length > this.rules.maxSentences) {
    throw new BadRequestException(
      `Exceeds max sentences: ${sentences.length} (max: ${this.rules.maxSentences})`
    );
  }

  // Rule 4: Sentence length
  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/).length;

    if (words > this.rules.maxSentenceLength) {
      throw new BadRequestException(
        `Sentence ${index + 1} too long: ${words} words (max: ${this.rules.maxSentenceLength})`
      );
    }

    if (words < this.rules.minSentenceLength) {
      throw new BadRequestException(
        `Sentence ${index + 1} too short: ${words} words (min: ${this.rules.minSentenceLength})`
      );
    }
  });
}
}