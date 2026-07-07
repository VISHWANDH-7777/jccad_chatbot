export type KnowledgeStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Published' | 'Archived';

export type KnowledgeCategory =
  | 'Company Profile'
  | 'Departments'
  | 'Services'
  | 'Courses'
  | 'Internships'
  | 'Workshops'
  | 'Policies'
  | 'FAQs'
  | 'Engineering Domains'
  | 'Research'
  | 'Announcements'
  | 'Support'
  | 'General';

export interface KnowledgeSourceRef {
  sourceType: 'Profile' | 'Document' | 'Crawler';
  sourceId: string;
  sourceVersion: number;
}

export interface KnowledgeRelationship {
  type: 'belongs_to' | 'relates_to' | 'prerequisite_of' | 'taught_by';
  targetItemId: string; // ID of target KnowledgeItem
  targetItemTitle: string;
}

export interface KnowledgeSection {
  heading: string;
  subheading?: string;
  content: string;
  contentType: 'paragraph' | 'list' | 'table' | 'definition';
}

export interface KnowledgeMetadata {
  topic: string;
  tags: string[];
  keywords: string[];
  qualityScore: number; // Quality assessment metric (0-100)
  language: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  sections: KnowledgeSection[];
  relationships: KnowledgeRelationship[];
  source: KnowledgeSourceRef;
  metadata: KnowledgeMetadata;
  status: KnowledgeStatus;
  version: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
