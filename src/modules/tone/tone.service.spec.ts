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
              const config = {
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
      // Note: This would call OpenAI API in real scenario
      // We'll mock this in integration tests
      expect(service).toBeDefined();
    });
  });

  describe('rule enforcement', () => {
    it('should validate banned phrases', () => {
      const service_instance = service as any;
      
      // Test banned phrase detection
      expect(() => {
        service_instance.enforceRules('I am excited to announce this feature');
      }).toThrow('Contains banned phrase');
    });

    it('should validate sentence length', () => {
      const service_instance = service as any;
      const longSentence = 'This is a very very very very very very very very very very very long sentence.';
      
      expect(() => {
        service_instance.enforceRules(longSentence);
      }).toThrow('too long');
    });

    it('should validate X character limit', () => {
      const service_instance = service as any;
      const tooLong = 'a'.repeat(281);
      
      expect(() => {
        service_instance.enforceRules(tooLong);
      }).toThrow('Exceeds X character limit');
    });
  });
});