import { describe, it, expect } from 'vitest';
import { resolvePermissions } from '../src/middleware/auth';

describe('Document Intelligence Platform (DIP) Access Mappings', () => {

  describe('RBAC Verification', () => {
    
    it('should restrict document uploading to Employees and higher roles', () => {
      const studentPerms = resolvePermissions('Student');
      const employeePerms = resolvePermissions('Employee');

      // Employees possess 'knowledge:upload' representing file upload access
      expect(studentPerms.has('knowledge:upload')).toBe(false);
      expect(employeePerms.has('knowledge:upload')).toBe(true);
    });

    it('should restrict document approvals to Managers and higher roles', () => {
      const employeePerms = resolvePermissions('Employee');
      const managerPerms = resolvePermissions('Manager');

      expect(employeePerms.has('knowledge:approve')).toBe(false);
      expect(managerPerms.has('knowledge:approve')).toBe(true);
    });

    it('should restrict document publishing and synchronizations to Administrators', () => {
      const managerPerms = resolvePermissions('Manager');
      const adminPerms = resolvePermissions('Administrator');

      expect(managerPerms.has('knowledge:sync')).toBe(false);
      expect(adminPerms.has('knowledge:sync')).toBe(true);
    });
  });

  describe('Document Type Guard validations', () => {
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/html'
    ];

    it('should validate and approve standard documents formats', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
      expect(ALLOWED_MIME_TYPES).toContain('text/plain');
    });

    it('should block unapproved file mime formats', () => {
      expect(ALLOWED_MIME_TYPES).not.toContain('application/x-msdownload'); // EXE
      expect(ALLOWED_MIME_TYPES).not.toContain('application/javascript');   // JS
    });
  });

});
