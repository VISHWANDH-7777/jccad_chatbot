import mongoose, { Schema, Document } from 'mongoose';
import { CompanyProfileData, ReviewHistoryEntry, ProfileStatus } from '../../../shared/types/profile';

export interface ICompanyProfileDocument extends Document {
  version: number;
  status: ProfileStatus;
  data: CompanyProfileData;
  reviewHistory: ReviewHistoryEntry[];
  approvedBy?: mongoose.Types.ObjectId;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadershipSchema = new Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  bio: { type: String, required: true, trim: true },
  avatarUrl: { type: String, required: false }
});

const FaqItemSchema = new Schema({
  id: { type: String, required: true },
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true }
});

const CompanyProfileSchema: Schema<ICompanyProfileDocument> = new Schema(
  {
    version: {
      type: Number,
      required: true,
      default: 1
    },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Pending Review', 'Approved', 'Published', 'Archived'],
      default: 'Draft'
    },
    data: {
      companyName: { type: String, required: true, trim: true },
      tagline: { type: String, required: true, trim: true },
      aboutUs: { type: String, required: true, trim: true },
      mission: { type: String, required: true, trim: true },
      vision: { type: String, required: true, trim: true },
      coreValues: [{ type: String }],
      organizationType: { type: String, required: true, trim: true },
      targetAudience: [{ type: String }],
      domains: [{ type: String }],
      services: [{ type: String }],
      softwareExpertise: [{ type: String }],
      industriesServed: [{ type: String }],
      contactEmail: {
        type: String,
        required: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address']
      },
      contactPhone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      websiteUrl: { type: String, required: true, trim: true },
      workingHours: { type: String, required: true, trim: true },
      socialLinks: {
        linkedin: { type: String, required: false },
        facebook: { type: String, required: false },
        twitter: { type: String, required: false }
      },
      leadership: [LeadershipSchema],
      stats: {
        studentCount: { type: Number, required: true, default: 0 },
        workshopCount: { type: Number, required: true, default: 0 },
        uavProjectsCount: { type: Number, required: true, default: 0 },
        industryPartnersCount: { type: Number, required: true, default: 0 }
      },
      faqs: [FaqItemSchema]
    },
    reviewHistory: [
      {
        status: { type: String, required: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String }
      }
    ],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

// Indexes to access the single active record and perform search queries
CompanyProfileSchema.index({ status: 1 });
CompanyProfileSchema.index({ 'data.companyName': 'text', 'data.aboutUs': 'text' });

export const CompanyProfile = mongoose.model<ICompanyProfileDocument>('CompanyProfile', CompanyProfileSchema);
