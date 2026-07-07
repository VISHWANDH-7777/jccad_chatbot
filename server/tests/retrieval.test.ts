import { describe, it, expect } from 'vitest';
import { detectQueryIntent, calculateRrfScore } from '../src/controllers/retrieval';

describe('Intelligent Retrieval Engine Ingress & Reranking Tests', () => {

  describe('Query Intent Classification Engine', () => {
    it('should classify greetings as Greeting intent', () => {
      expect(detectQueryIntent('Hello, good morning')).toBe('Greeting');
      expect(detectQueryIntent('Hey')).toBe('Greeting');
    });

    it('should classify specific JCCAD keywords as CompanyQuery intent', () => {
      expect(detectQueryIntent('What are the mechatronics course syllabus details?')).toBe('CompanyQuery');
      expect(detectQueryIntent('Quadcopter drone specifications')).toBe('CompanyQuery');
    });

    it('should classify general coding queries as GeneralAI intent', () => {
      expect(detectQueryIntent('How to write a javascript script loop')).toBe('GeneralAI');
    });
  });

  describe('RRF Reranking Calculation Metrics', () => {
    it('should correctly balance vector scores and quality weights', () => {
      // High vector similarity (0.9), low quality score (50)
      const scoreA = calculateRrfScore(0.9, 50);
      
      // Medium vector similarity (0.75), maximum quality score (100)
      const scoreB = calculateRrfScore(0.75, 100);

      // Score A: 0.9 * 0.7 + 0.5 * 0.3 = 0.63 + 0.15 = 0.78
      // Score B: 0.75 * 0.7 + 1.0 * 0.3 = 0.525 + 0.30 = 0.825
      expect(scoreB).toBeGreaterThan(scoreA);
    });
  });

});
