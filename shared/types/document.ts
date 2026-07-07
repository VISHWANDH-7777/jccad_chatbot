export type DocumentStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Published' | 'Archived';

export interface DocumentMetadata {
  title: string;
  description: string;
  author: string;
  ownerId: string;
  department: string;
  category: string;
  tags: string[];
  keywords: string[];
  language: string;
  visibility: 'Public' | 'Internal' | 'Restricted';
  retentionPolicy: string;
  expirationDate?: string;
}

export interface DocumentApprovalHistory {
  status: DocumentStatus;
  actorId: string;
  actorName: string;
  timestamp: string;
  notes?: string;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  storageKey: string;
  version: number;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  approvalHistory: DocumentApprovalHistory[];
  createdAt: string;
  updatedAt: string;
}
