import { describe, it, expect } from 'vitest';
import { generateMockEmbedding, calculateCosineSimilarity } from '../src/controllers/vector';

describe('Embedding & Vector Intelligence Platform (EVIP) Core Tests', () => {

  describe('Mock Embedding Generations', () => {
    it('should generate a float array vector of exactly 1536 dimensions', () => {
      const text = 'Testing mechatronics courses specifications';
      const vector = generateMockEmbedding(text);
      
      expect(vector).toBeDefined();
      expect(Array.isArray(vector)).toBe(true);
      expect(vector.length).toBe(1536);
    });

    it('should normalize generated vectors to a magnitude of 1.0', () => {
      const text = 'Normalizing check';
      const vector = generateMockEmbedding(text);
      
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      expect(magnitude).toBeCloseTo(1.0, 5);
    });
  });

  describe('Cosine Similarity Calculations', () => {
    it('should calculate accurate similarity values for identical normalized vectors', () => {
      const vecA = generateMockEmbedding('Same content');
      const vecB = [...vecA]; // Copy vector
      
      const similarity = calculateCosineSimilarity(vecA, vecB);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should handle zero similarity for orthogonal vectors', () => {
      // Create orthogonal vectors manually
      const vecA = [1.0, 0.0];
      const vecB = [0.0, 1.0];
      
      const similarity = calculateCosineSimilarity(vecA, vecB);
      expect(similarity).toBe(0.0);
    });
  });

});
