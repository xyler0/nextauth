import { JournalScorer } from './journal.scorer';

describe('JournalScorer', () => {
  let scorer: JournalScorer;

  beforeEach(() => {
    scorer = new JournalScorer();
  });

  describe('conviction scoring', () => {
    it('should score declarative statements highly', () => {
      const result = scorer.score('The system is production ready.');
      expect(result.convictionScore).toBeGreaterThan(0);
    });

    it('should penalize hedging language', () => {
      const hedged = scorer.score('Maybe this might work perhaps.');
      const declarative = scorer.score('This works perfectly.');
      
      expect(declarative.convictionScore).toBeGreaterThan(hedged.convictionScore);
    });

    it('should reward action verbs', () => {
      const result = scorer.score('Built a new feature today.');
      expect(result.convictionScore).toBeGreaterThan(2);
    });
  });

  describe('novelty scoring', () => {
    it('should reward specific numbers', () => {
      const withNumbers = scorer.score('Improved performance by 50%.');
      const withoutNumbers = scorer.score('Improved performance significantly.');
      
      expect(withNumbers.noveltyScore).toBeGreaterThan(withoutNumbers.noveltyScore);
    });

    it('should reward technical terms', () => {
      const result = scorer.score('Optimized the database query algorithm.');
      expect(result.noveltyScore).toBeGreaterThan(0);
    });

    it('should penalize generic fluff', () => {
      const fluff = scorer.score('Really just did some things today.');
      expect(fluff.noveltyScore).toBe(0);
    });
  });

  describe('signal scoring', () => {
    it('should reward concise text', () => {
      const concise = scorer.score('Shipped the feature.');
      const verbose = scorer.score('I spent a lot of time working on implementing the feature and eventually I managed to ship it after much effort.');
      
      expect(concise.signalScore).toBeGreaterThan(verbose.signalScore);
    });

    it('should reward outcome-oriented language', () => {
      const result = scorer.score('Learned that caching reduces latency.');
      expect(result.signalScore).toBeGreaterThan(0);
    });
  });

  describe('total scoring', () => {
    it('should combine all scores', () => {
      const result = scorer.score('Built API. Performance improved 40%.');
      
      expect(result.totalScore).toBe(
        result.convictionScore + result.noveltyScore + result.signalScore
      );
      expect(result.totalScore).toBeGreaterThan(5);
    });
  });
});