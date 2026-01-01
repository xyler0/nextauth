export interface ScoredSegment {
  text: string;
  convictionScore: number;
  noveltyScore: number;
  signalScore: number;
  totalScore: number;
}