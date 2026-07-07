export type ProfileStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Published' | 'Archived';

export interface CompanyStats {
  studentCount: number;
  workshopCount: number;
  uavProjectsCount: number;
  industryPartnersCount: number;
}

export interface LeadershipMember {
  name: string;
  role: string;
  bio: string;
  avatarUrl?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface CompanyProfileData {
  companyName: string;
  tagline: string;
  aboutUs: string;
  mission: string;
  vision: string;
  coreValues: string[];
  organizationType: string;
  targetAudience: string[];
  domains: string[];
  services: string[];
  softwareExpertise: string[];
  industriesServed: string[];
  contactEmail: string;
  contactPhone: string;
  address: string;
  websiteUrl: string;
  workingHours: string;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  leadership: LeadershipMember[];
  stats: CompanyStats;
  faqs: FaqItem[];
}

export interface ReviewHistoryEntry {
  status: ProfileStatus;
  actorId: string;
  actorName: string;
  timestamp: string;
  notes?: string;
}

export interface CompanyProfile {
  id: string;
  version: number;
  status: ProfileStatus;
  data: CompanyProfileData;
  reviewHistory: ReviewHistoryEntry[];
  approvedBy?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
}
