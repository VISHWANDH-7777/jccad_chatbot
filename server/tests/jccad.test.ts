import { describe, it, expect } from 'vitest';
import { detectQueryIntent, calculateRrfScore } from '../src/controllers/retrieval';

// Mock system prompts from orchestration controller to test prompt selection
const SYSTEM_PROMPT_JCCAD = `
You are the JCCAD Company Intelligence Platform Assistant, the official Enterprise Company Intelligence Assistant for JCCAD Software Solutions.
Your answers regarding JCCAD Software Solutions MUST be grounded STRICTLY on the GROUNDING CONTEXT provided below.
`;

const SYSTEM_PROMPT_GENERAL = `
You are the JCCAD Company Intelligence Platform Assistant.
The user is asking a general question. Answer using your pre-trained knowledge.
`;

// Helper simulating coreference resolution from streamChat
const resolveCoreference = (query: string, messages: Array<{ role: string; content: string }>): string => {
  let queryForRetrieval = query;
  if (messages && messages.length > 0) {
    const hasJCCADContext = messages.some((m) => 
      m.content.toLowerCase().includes('jccad') || m.content.toLowerCase().includes('they') || m.content.toLowerCase().includes('them')
    );
    
    if (hasJCCADContext) {
      const lowerQuery = query.toLowerCase();
      const pronouns = ['they', 'them', 'their', 'it', 'its', 'he', 'she', 'company', 'organization', 'hub', 'agency', 'firm'];
      const companyKeywords = ['services', 'software', 'teach', 'learn', 'courses', 'internship', 'training', 'contact', 'email', 'website', 'vision', 'mission', 'about', 'who', 'what'];
      
      const needsExpansion = pronouns.some(p => new RegExp(`\\b${p}\\b`).test(lowerQuery)) || 
                             companyKeywords.some(k => lowerQuery.includes(k));
                             
      if (needsExpansion && !lowerQuery.includes('jccad')) {
        queryForRetrieval = `${query} JCCAD`;
      }
    }
  }
  return queryForRetrieval;
};

describe('JCCAD Enterprise Company Intelligence Chatbot Platform Tests', () => {

  describe('Section 3 & Section 11: Intent Routing and Classification Rules', () => {
    
    it('should classify JCCAD profile queries as CompanyQuery intent', () => {
      const companyQueries = [
        'What is JCCAD?',
        'Tell me about JCCAD.',
        'What services does JCCAD provide?',
        'What software does JCCAD teach?',
        'Who are your target customers?',
        'What industries do you serve?',
        'What is your mission?',
        'What is your vision?',
        'How can I contact JCCAD?',
        'What internship opportunities are available?',
        'Do you provide CAD training?',
        'Do you provide website development?'
      ];

      for (const q of companyQueries) {
        expect(detectQueryIntent(q)).toBe('CompanyQuery');
      }
    });

    it('should classify General AI questions as GeneralAI intent for configured AI fallback', () => {
      const generalQueries = [
        'What is Artificial Intelligence?',
        'What is Java?',
        'What is React?',
        'Explain quantum physics.'
      ];

      for (const q of generalQueries) {
        expect(detectQueryIntent(q)).toBe('GeneralAI');
      }
    });

    it('should classify greetings as Greeting intent', () => {
      expect(detectQueryIntent('Hello, good morning')).toBe('Greeting');
      expect(detectQueryIntent('Hey')).toBe('Greeting');
    });

  });

  describe('Section 6: Conversation Memory Coreference Pronoun Resolution', () => {
    
    it('should expand pronouns to include JCCAD if previous thread context is about JCCAD', () => {
      const threadHistory = [
        { role: 'user', content: 'Tell me about JCCAD.' },
        { role: 'assistant', content: 'JCCAD Software Solutions is an engineering hub...' }
      ];

      const expandedQuery = resolveCoreference('What services do they provide?', threadHistory);
      expect(expandedQuery).toContain('JCCAD');
      expect(detectQueryIntent(expandedQuery)).toBe('CompanyQuery');
    });

    it('should NOT expand pronouns if there is no JCCAD context in conversation thread history', () => {
      const threadHistory = [
        { role: 'user', content: 'Tell me about Java compiler optimization.' },
        { role: 'assistant', content: 'Java optimizes code by compiling bytecode...' }
      ];

      const query = 'Tell me more about them.';
      const expandedQuery = resolveCoreference(query, threadHistory);
      expect(expandedQuery).toBe(query);
      expect(detectQueryIntent(expandedQuery)).toBe('GeneralAI');
    });

  });

  describe('Section 4 & Section 11: Prompt Selection Logic', () => {
    
    it('should select strict grounding system prompt for CompanyQuery intent', () => {
      const intent = detectQueryIntent('What is JCCAD?');
      const systemPromptTemplate = (intent === 'CompanyQuery') ? SYSTEM_PROMPT_JCCAD : SYSTEM_PROMPT_GENERAL;
      
      expect(systemPromptTemplate).toContain('grounded STRICTLY');
      expect(systemPromptTemplate).toContain('JCCAD Software Solutions');
      expect(systemPromptTemplate).not.toContain('general question');
    });

    it('should select conversational general system prompt for GeneralAI intent', () => {
      const intent = detectQueryIntent('What is React?');
      const systemPromptTemplate = (intent === 'CompanyQuery') ? SYSTEM_PROMPT_JCCAD : SYSTEM_PROMPT_GENERAL;
      
      expect(systemPromptTemplate).toContain('general question');
      expect(systemPromptTemplate).not.toContain('gounded STRICTLY');
    });

  });

  describe('Section 8: Search Optimization & Reranking Blending', () => {
    
    it('should improve ranking score when strong lexical/synonym keyword match exists', () => {
      // Base cosine similarity mock score
      const baseCosine = 0.55;
      
      // High lexical match (e.g. 0.9) vs low lexical match (e.g. 0.1)
      const scoreHighLexical = calculateRrfScore(baseCosine, 80, 0.9);
      const scoreLowLexical = calculateRrfScore(baseCosine, 80, 0.1);
      
      expect(scoreHighLexical).toBeGreaterThan(scoreLowLexical);
    });

  });

});
