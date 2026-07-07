import { UserRole } from './auth';

export type ToolCategory = 'Knowledge' | 'Student' | 'Employee' | 'Admin' | 'External';

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  requiredRole: UserRole;
  version: string;
  timeoutMs: number;
  inputSchema: any; // JSON schema descriptor for validations
}

export interface ToolInvocationResult {
  toolName: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs: number;
}
