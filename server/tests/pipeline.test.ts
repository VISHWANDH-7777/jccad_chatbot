import { describe, it, expect } from 'vitest';
import { estimateTokens, planChunks } from '../src/controllers/pipeline';

describe('AI Data Ingestion Pipeline Ingress Tests', () => {

  describe('Token Estimator Calculations', () => {
    it('should calculate estimated token length using characters ratios', () => {
      const text = 'Quadcopter'; // 10 chars
      const estimated = estimateTokens(text);
      expect(estimated).toBe(3); // Ceil(10/4)
    });

    it('should handle brief or empty text inputs safely', () => {
      expect(estimateTokens('')).toBe(0);
    });
  });

  describe('Chunk Planning and Overlaps', () => {
    it('should split text into chunks based on maximum tokens limits', () => {
      // Create a mock document text containing 200 words
      const words = Array(200).fill('word');
      const text = words.join(' ');
      
      const chunks = planChunks(text, 50, 10);
      expect(chunks.length).toBeGreaterThan(1);
      
      // Verify that the first chunk contains text content
      expect(chunks[0]).toBeDefined();
      expect(chunks[0].split(/\s+/).length).toBeLessThan(100);
    });
  });

});
