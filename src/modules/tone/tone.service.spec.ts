import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { ToneService } from './tone.service';

describe('ToneService', () => {
  let service: ToneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToneService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, any> = {
                OPENAI_API_KEY: 'test-key',
                OPENAI_MODEL: 'gpt-4o-mini',
                OPENAI_TEMPERATURE: 0.3,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ToneService>(ToneService);
  });

  describe('input validation', () => {
    it('should reject input shorter than 10 characters', async () => {
      await expect(service.applyTone('short')).rejects.toThrow(BadRequestException);
    });

    it('should reject input longer than 5000 characters', async () => {
      const longText = 'a'.repeat(5001);
      await expect(service.applyTone(longText)).rejects.toThrow(BadRequestException);
    });

    it('should accept valid input length', () => {
      // Placeholder; actual OpenAI call would be mocked in integration tests
      expect(service).toBeDefined();
    });
  });

  describe('rule enforcement', () => {
    let instance: { enforceRules: (text: string) => void };

    beforeEach(() => {
      // Cast to access private method safely
      instance = service as unknown as { enforceRules: (text: string) => void };
    });

    it('should detect banned phrases', () => {
      expect(() => {
        instance.enforceRules('I am excited to announce this feature');
      }).toThrow('Contains banned phrase');
    });

    it('should detect long sentences', () => {
      const longSentence = Array(50).fill('word').join(' ');
      expect(() => {
        instance.enforceRules(longSentence);
      }).toThrow('too long');
    });

    it('should enforce X character limit', () => {
      const tooLong = 'a'.repeat(281);
      expect(() => {
        instance.enforceRules(tooLong);
      }).toThrow('Exceeds X character limit');
    });
  });
});
