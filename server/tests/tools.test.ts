import { describe, it, expect, vi } from 'vitest';
import { executeTool } from '../src/services/toolExecutionEngine';
import { toolRegistry } from '../src/services/toolRegistry';

// Mock DB Mongoose Model call queries to isolate engine checks
vi.mock('../src/models/KnowledgeItem', () => ({
  KnowledgeItem: {
    findOne: vi.fn().mockResolvedValue({
      title: 'MECH101 Course details',
      sections: [{ heading: 'Syllabus', content: 'Intro to robotics.' }]
    })
  }
}));

describe('AI Tools & Skills Framework Invocations Tests', () => {

  describe('Permission Gate Controls (RBAC)', () => {
    it('should reject unauthorized tool execution calls', async () => {
      // course_lookup requires Student role. Guest execution must fail.
      const result = await executeTool('course_lookup', { courseCode: 'MECH101' }, 'Guest');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Forbidden');
    });

    it('should approve execution for authorized role levels', async () => {
      const result = await executeTool('course_lookup', { courseCode: 'MECH101' }, 'Student');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Input Argument Schema Checks', () => {
    it('should reject invocations missing required arguments', async () => {
      const result = await executeTool('course_lookup', {}, 'Student');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Required parameter');
    });
  });

  describe('Execution Timeout Protection Gates', () => {
    it('should reject tool execution if timeouts exceed thresholds', async () => {
      // Register custom slow tool
      toolRegistry.register(
        'slow_tool',
        {
          name: 'slow_tool',
          description: 'A tool that takes too long to respond.',
          category: 'Knowledge',
          requiredRole: 'Guest',
          version: '1.0.0',
          timeoutMs: 50,
          inputSchema: { type: 'object', required: [] }
        },
        async () => {
          // Simulate latency
          await new Promise((resolve) => setTimeout(resolve, 200));
          return 'Success';
        }
      );

      const result = await executeTool('slow_tool', {}, 'Guest');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });
  });

});
