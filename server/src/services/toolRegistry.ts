import { ToolDefinition, ToolCategory } from '../../../shared/types/tools';
import { UserRole } from '../../../shared/types/auth';
import { KnowledgeItem } from '../models/KnowledgeItem';

export interface RegisterEntry {
  definition: ToolDefinition;
  execute: (args: any) => Promise<any>;
}

class ToolRegistryService {
  private registry = new Map<string, RegisterEntry>();

  constructor() {
    this.registerBuiltInTools();
  }

  public register(name: string, definition: ToolDefinition, execute: (args: any) => Promise<any>) {
    this.registry.set(name, { definition, execute });
  }

  public get(name: string): RegisterEntry | undefined {
    return this.registry.get(name);
  }

  public list(userRole: UserRole): ToolDefinition[] {
    const list: ToolDefinition[] = [];
    // Role Hierarchy levels check helper
    const ROLE_LEVELS: Record<UserRole, number> = {
      'Guest': 0,
      'Student': 1,
      'Professional': 2,
      'Employee': 3,
      'Manager': 4,
      'Administrator': 5,
      'Super Administrator': 6
    };

    const userLevel = ROLE_LEVELS[userRole] || 0;

    this.registry.forEach((entry) => {
      const requiredLevel = ROLE_LEVELS[entry.definition.requiredRole] || 0;
      if (userLevel >= requiredLevel) {
        list.push(entry.definition);
      }
    });

    return list;
  }

  private registerBuiltInTools() {
    // 1. Course Lookup Tool
    this.register(
      'course_lookup',
      {
        name: 'course_lookup',
        description: 'Lookup syllabus parameters and schedules for mechatronics courses.',
        category: 'Student',
        requiredRole: 'Student',
        version: '1.0.0',
        timeoutMs: 3000,
        inputSchema: {
          type: 'object',
          properties: {
            courseCode: { type: 'string', description: 'Subject code target, e.g. MECH101' }
          },
          required: ['courseCode']
        }
      },
      async (args: { courseCode: string }) => {
        const item = await KnowledgeItem.findOne({
          category: 'Courses',
          title: new RegExp(args.courseCode, 'i'),
          status: 'Published'
        });
        if (!item) return { message: `Course ${args.courseCode} not found in dynamic indexing` };
        return {
          title: item.title,
          details: item.sections.map((s) => `${s.heading}: ${s.content}`).join('\n')
        };
      }
    );

    // 2. FAQ Lookup Tool
    this.register(
      'faq_lookup',
      {
        name: 'faq_lookup',
        description: 'Search official frequently asked questions regarding labs or registration.',
        category: 'Knowledge',
        requiredRole: 'Guest',
        version: '1.0.0',
        timeoutMs: 2000,
        inputSchema: {
          type: 'object',
          properties: {
            keyword: { type: 'string', description: 'Topic or keyword to query, e.g. hours' }
          },
          required: ['keyword']
        }
      },
      async (args: { keyword: string }) => {
        const items = await KnowledgeItem.find({
          category: 'FAQs',
          $text: { $search: args.keyword },
          status: 'Published'
        }).limit(3);

        return items.map((i) => ({
          question: i.title,
          answer: i.sections.map((s) => s.content).join('\n')
        }));
      }
    );
  }
}

export const toolRegistry = new ToolRegistryService();
