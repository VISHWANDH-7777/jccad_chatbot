import { toolRegistry } from './toolRegistry';
import { ToolInvocationResult } from '../../../shared/types/tools';
import { UserRole } from '../../../shared/types/auth';

// Role Hierarchy index mapper
const ROLE_LEVELS: Record<UserRole, number> = {
  'Guest': 0,
  'Student': 1,
  'Professional': 2,
  'Employee': 3,
  'Manager': 4,
  'Administrator': 5,
  'Super Administrator': 6
};

export const executeTool = async (
  toolName: string,
  args: any,
  userRole: UserRole
): Promise<ToolInvocationResult> => {
  const startTime = Date.now();
  const entry = toolRegistry.get(toolName);

  if (!entry) {
    return {
      toolName,
      success: false,
      error: `Tool ${toolName} is not registered in the system registry`,
      executionTimeMs: Date.now() - startTime
    };
  }

  const { definition, execute } = entry;

  // 1. Validate Permission Role Constraints
  const userLevel = ROLE_LEVELS[userRole] || 0;
  const requiredLevel = ROLE_LEVELS[definition.requiredRole] || 0;

  if (userLevel < requiredLevel) {
    return {
      toolName,
      success: false,
      error: `Forbidden: role level ${userRole} is insufficient to execute this tool`,
      executionTimeMs: Date.now() - startTime
    };
  }

  // 2. Validate input schema arguments
  const schema = definition.inputSchema;
  if (schema && schema.required) {
    for (const key of schema.required) {
      if (args[key] === undefined || args[key] === null) {
        return {
          toolName,
          success: false,
          error: `Validation Error: Required parameter '${key}' is missing`,
          executionTimeMs: Date.now() - startTime
        };
      }
    }
  }

  // 3. Execute tool inside a Promise race to enforce timeouts
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: Tool execution exceeded limit of ${definition.timeoutMs}ms`)), definition.timeoutMs)
    );

    const executionPromise = execute(args);

    const data = await Promise.race([executionPromise, timeoutPromise]);

    return {
      toolName,
      success: true,
      data,
      executionTimeMs: Date.now() - startTime
    };
  } catch (err: any) {
    return {
      toolName,
      success: false,
      error: err.message || 'Tool execution error occurred',
      executionTimeMs: Date.now() - startTime
    };
  }
};
