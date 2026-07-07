import { Response } from 'express';
import { CompanyProfile } from '../models/CompanyProfile';
import { ProfileVersion } from '../models/ProfileVersion';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProfileStatus } from '../../../shared/types/profile';

// Fetch the current published profile (Public Endpoint)
export const getPublished = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await CompanyProfile.findOne({ status: 'Published' });
    if (!profile) {
      return res.status(404).json({ error: 'No published company profile exists' });
    }
    return res.status(200).json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error retrieving published profile' });
  }
};

// Fetch latest active profile draft/approved version (Internal Endpoint)
export const getLatest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await CompanyProfile.findOne().sort({ updatedAt: -1 });
    if (!profile) {
      return res.status(404).json({ error: 'No company profile records exist yet' });
    }
    return res.status(200).json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error retrieving latest profile' });
  }
};

// Create or update a profile draft
export const updateDraft = async (req: AuthenticatedRequest, res: Response) => {
  const { data } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    let profile = await CompanyProfile.findOne().sort({ updatedAt: -1 });

    if (!profile) {
      // First initialization
      profile = new CompanyProfile({
        version: 1,
        status: 'Draft' as const,
        data,
        reviewHistory: [
          {
            status: 'Draft',
            actorId: user.id,
            actorName: user.role,
            notes: 'Initial profile setup',
            timestamp: new Date().toISOString()
          }
        ]
      });
    } else {
      // If the current latest state is not Draft, create a new draft increment
      if (profile.status !== 'Draft') {
        const nextVersion = profile.version + 1;
        profile = new CompanyProfile({
          version: nextVersion,
          status: 'Draft' as const,
          data,
          reviewHistory: [
            {
              status: 'Draft',
              actorId: user.id,
              actorName: user.role,
              notes: `Created draft for version ${nextVersion}`,
              timestamp: new Date().toISOString()
            }
          ]
        });
      } else {
        // Update existing draft data
        profile.data = data;
        profile.reviewHistory.push({
          status: 'Draft',
          actorId: user.id,
          actorName: user.role,
          notes: 'Updated draft parameters',
          timestamp: new Date().toISOString()
        });
      }
    }

    await profile.save();

    await AuditLog.create({
      userId: user.id,
      action: 'profile:draft_update',
      resource: profile._id.toString(),
      ipAddress,
      userAgent,
      status: 'success',
      details: `Updated draft version ${profile.version}`
    });

    return res.status(200).json({ message: 'Draft updated successfully', profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error saving profile draft', details: err.message });
  }
};

// Submit draft for review
export const submitForReview = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const profile = await CompanyProfile.findOne({ status: 'Draft' });
    if (!profile) {
      return res.status(400).json({ error: 'No active profile draft found to submit' });
    }

    profile.status = 'Pending Review';
    profile.reviewHistory.push({
      status: 'Pending Review',
      actorId: user.id,
      actorName: user.role,
      notes: 'Submitted for managerial review',
      timestamp: new Date().toISOString()
    });

    await profile.save();

    await AuditLog.create({
      userId: user.id,
      action: 'profile:submit_review',
      resource: profile._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Profile submitted for review', profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during submission' });
  }
};

// Approve profile update
export const approve = async (req: AuthenticatedRequest, res: Response) => {
  const { notes } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const profile = await CompanyProfile.findOne({ status: 'Pending Review' });
    if (!profile) {
      return res.status(400).json({ error: 'No profile pending review found' });
    }

    profile.status = 'Approved';
    profile.approvedBy = user.id as any;
    profile.reviewHistory.push({
      status: 'Approved',
      actorId: user.id,
      actorName: user.role,
      notes: notes || 'Approved updates',
      timestamp: new Date().toISOString()
    });

    await profile.save();

    await AuditLog.create({
      userId: user.id,
      action: 'profile:approve',
      resource: profile._id.toString(),
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Profile version approved', profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during approval' });
  }
};

// Publish approved version and archive prior published versions
export const publish = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const profile = await CompanyProfile.findOne({ status: 'Approved' });
    if (!profile) {
      return res.status(400).json({ error: 'No approved profile found to publish' });
    }

    // Archive prior published profile
    await CompanyProfile.updateMany({ status: 'Published' }, { status: 'Archived' });

    profile.status = 'Published';
    profile.publishedBy = user.id as any;
    profile.reviewHistory.push({
      status: 'Published',
      actorId: user.id,
      actorName: user.role,
      notes: 'Published to live chatbot systems',
      timestamp: new Date().toISOString()
    });

    await profile.save();

    // Create a version snapshot for rollbacks
    const versionSnapshot = new ProfileVersion({
      profileId: profile._id,
      version: profile.version,
      data: profile.data,
      createdById: user.id,
      createdByName: user.role
    });

    await versionSnapshot.save();

    // Log security audit trail
    await AuditLog.create({
      userId: user.id,
      action: 'profile:publish',
      resource: profile._id.toString(),
      ipAddress,
      userAgent,
      status: 'success',
      details: `Published version ${profile.version}`
    });

    // In a real RAG application, we would call an AI synchronization hook here.
    // E.g., invalidate Redis prompt configurations and rebuild vector indexes.

    return res.status(200).json({ message: 'Profile published successfully', profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during publish operations', details: err.message });
  }
};

// Reject draft reviews
export const reject = async (req: AuthenticatedRequest, res: Response) => {
  const { notes } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!notes) {
    return res.status(400).json({ error: 'Rejection notes are required to reject updates' });
  }

  try {
    const profile = await CompanyProfile.findOne({ status: 'Pending Review' });
    if (!profile) {
      return res.status(400).json({ error: 'No profile pending review found' });
    }

    profile.status = 'Draft';
    profile.reviewHistory.push({
      status: 'Draft',
      actorId: user.id,
      actorName: user.role,
      notes: `Rejected: ${notes}`,
      timestamp: new Date().toISOString()
    });

    await profile.save();

    await AuditLog.create({
      userId: user.id,
      action: 'profile:reject',
      resource: profile._id.toString(),
      ipAddress,
      userAgent,
      status: 'success',
      details: `Rejected review. Notes: ${notes}`
    });

    return res.status(200).json({ message: 'Profile review rejected. Reverted to draft.', profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during rejection' });
  }
};

// Retrieve version history list
export const getVersions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const versions = await ProfileVersion.find().sort({ version: -1 });
    return res.status(200).json({ versions });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error retrieving profile versions' });
  }
};

// Rollback profile data to a specified historical version
export const rollback = async (req: AuthenticatedRequest, res: Response) => {
  const { version } = req.body;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!version) {
    return res.status(400).json({ error: 'Target version number is required' });
  }

  try {
    const historicalSnapshot = await ProfileVersion.findOne({ version });
    if (!historicalSnapshot) {
      return res.status(404).json({ error: `Version ${version} snapshot not found` });
    }

    let latestProfile = await CompanyProfile.findOne().sort({ updatedAt: -1 });
    const nextVersionNum = latestProfile ? latestProfile.version + 1 : 1;

    // Archive all current published statuses
    await CompanyProfile.updateMany({ status: 'Published' }, { status: 'Archived' });

    // Create a new published entry containing the historical data
    const rolledBackProfile = new CompanyProfile({
      version: nextVersionNum,
      status: 'Published' as const,
      data: historicalSnapshot.data,
      publishedBy: user.id as any,
      reviewHistory: [
        {
          status: 'Published',
          actorId: user.id,
          actorName: user.role,
          notes: `Rolled back to version ${version}`
        }
      ]
    });

    await rolledBackProfile.save();

    // Create new version snapshot entry in history
    const nextSnapshot = new ProfileVersion({
      profileId: rolledBackProfile._id,
      version: nextVersionNum,
      data: rolledBackProfile.data,
      createdById: user.id,
      createdByName: user.role
    });

    await nextSnapshot.save();

    await AuditLog.create({
      userId: user.id,
      action: 'profile:rollback',
      resource: rolledBackProfile._id.toString(),
      ipAddress,
      userAgent,
      status: 'success',
      details: `Rolled back profile to version ${version}. Created new version ${nextVersionNum}.`
    });

    return res.status(200).json({
      message: `Profile rolled back to version ${version} successfully`,
      profile: rolledBackProfile
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during rollback operations', details: err.message });
  }
};
