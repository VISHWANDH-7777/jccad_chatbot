import { Response } from 'express';
import { toolRegistry } from '../services/toolRegistry';
import { executeTool } from '../services/toolExecutionEngine';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';

export const listAvailableTools = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const list = toolRegistry.list(user.role);
    return res.status(200).json({ tools: list });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error listing tools' });
  }
};

export const invokeTool = async (req: AuthenticatedRequest, res: Response) => {
  const { toolName, args } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!toolName) {
    return res.status(400).json({ error: 'Parameter toolName is required' });
  }

  try {
    const result = await executeTool(toolName, args || {}, user.role);

    // Log security audit log for execution activity
    await AuditLog.create({
      userId: user.id,
      action: `tool:execute_${toolName}`,
      resource: toolName,
      ipAddress,
      userAgent,
      status: result.success ? 'success' : 'failure',
      details: `Time: ${result.executionTimeMs}ms. Err: ${result.error || 'None'}`
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal system error executing tool call' });
  }
};
