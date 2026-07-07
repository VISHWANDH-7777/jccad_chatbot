import mongoose, { Schema, Document } from 'mongoose';
import { CompanyProfileData } from '../../../shared/types/profile';

export interface IProfileVersionDocument extends Document {
  profileId: mongoose.Types.ObjectId;
  version: number;
  data: CompanyProfileData;
  createdById: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
}

const ProfileVersionSchema: Schema<IProfileVersionDocument> = new Schema(
  {
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'CompanyProfile',
      required: true
    },
    version: {
      type: Number,
      required: true
    },
    data: {
      type: Schema.Types.Mixed,
      required: true
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdByName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
ProfileVersionSchema.index({ profileId: 1, version: 1 }, { unique: true });
ProfileVersionSchema.index({ version: -1 });

export const ProfileVersion = mongoose.model<IProfileVersionDocument>('ProfileVersion', ProfileVersionSchema);
