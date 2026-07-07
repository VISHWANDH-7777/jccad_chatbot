import { describe, it, expect } from 'vitest';
import { cleanTextSegment, classifyCategory, calculateQualityScore } from '../src/controllers/knowledge';

describe('Knowledge Engineering Platform (KEP) Core Rules Tests', () => {

  describe('Text Cleaning Normalizers', () => {
    it('should strip empty lines, tabs, and page footer lines correctly', () => {
      const dirty = `
        First line here.
        -- page 12 --
        
        Second line with\t\tmultiple spaces.
      `;
      const cleaned = cleanTextSegment(dirty);
      expect(cleaned).toContain('First line here.');
      expect(cleaned).toContain('Second line with multiple spaces.');
      expect(cleaned).not.toContain('-- page 12 --');
    });
  });

  describe('Automatic Classification Engine', () => {
    it('should classify course syllabuses into Courses category', () => {
      const category = classifyCategory('Robotics Syllabus 2026', 'This course syllabus details assignments and weekly class schedules.');
      expect(category).toBe('Courses');
    });

    it('should classify drone descriptions into Engineering Domains category', () => {
      const category = classifyCategory('UAV Quadcopter specs', 'The drone features automatic mechatronics stabilization and aeronautical blades.');
      expect(category).toBe('Engineering Domains');
    });

    it('should classify standard FAQ lists into FAQs category', () => {
      const category = classifyCategory('General FAQs', 'Frequently Asked Questions regarding JCCAD mechatronics labs.');
      expect(category).toBe('FAQs');
    });
  });

  describe('Quality Score Assessments', () => {
    it('should score high-quality structured sections as 100', () => {
      const sections = [
        { heading: 'General Intro', content: 'This is a long and detailed description of the JCCAD mechatronics labs that meets length checks.' }
      ];
      const score = calculateQualityScore(sections);
      expect(score).toBe(100);
    });

    it('should penalize sections with empty headings', () => {
      const sections = [
        { heading: '', content: 'Valid description that has length but lacks a descriptive heading.' }
      ];
      const score = calculateQualityScore(sections);
      expect(score).toBeLessThan(100);
    });

    it('should penalize sections with short content strings', () => {
      const sections = [
        { heading: 'Brief Intro', content: 'Short.' }
      ];
      const score = calculateQualityScore(sections);
      expect(score).toBeLessThan(100);
    });
  });

});
