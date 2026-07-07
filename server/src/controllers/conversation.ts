import { Response } from 'express';
import { Conversation } from '../models/Conversation';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { FeedbackPayload } from '../../../shared/types/conversation';
import fs from 'fs';

export const createConversation = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const conversation = new Conversation({
      userId: user.id,
      messages: []
    });

    await conversation.save();
    return res.status(201).json({ conversation });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error creating conversation' });
  }
};

export const listConversations = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const list = await Conversation.find({ userId: user.id })
      .select('id messages updatedAt')
      .sort({ updatedAt: -1 });

    const summaries = list.map((c) => {
      const firstMessage = c.messages.find((m) => m.role === 'user');
      const title = firstMessage ? firstMessage.content.substring(0, 30) + '...' : 'New Chat Thread';
      return {
        id: c._id,
        title,
        updatedAt: c.updatedAt
      };
    });

    return res.status(200).json({ conversations: summaries });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error listing conversations' });
  }
};

export const renameConversation = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title } = req.body;
  const user = req.user!;

  if (!title) {
    return res.status(400).json({ error: 'Title field is required' });
  }

  try {
    const conversation = await Conversation.findOne({ _id: id, userId: user.id });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation thread not found' });
    }

    // Since title is virtual derived from first message content,
    // we inject a system note message holding the title metadata
    conversation.messages.push({
      role: 'system',
      content: `System: Renamed thread to ${title}`,
      timestamp: new Date().toISOString()
    });

    await conversation.save();
    return res.status(200).json({ message: 'Conversation renamed successfully', title });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during renaming' });
  }
};

export const deleteConversation = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const result = await Conversation.deleteOne({ _id: id, userId: user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    await AuditLog.create({
      userId: user.id,
      action: 'conversation:delete',
      resource: id,
      ipAddress,
      userAgent,
      status: 'success'
    });

    return res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during deletion' });
  }
};

export const exportConversation = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  try {
    const conversation = await Conversation.findOne({ _id: id, userId: user.id });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const exportData = {
      conversationId: conversation._id,
      exportedAt: new Date().toISOString(),
      format: 'json',
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=conversation-${id}.json`);
    return res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error during export' });
  }
};

export const submitFeedback = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { messageIndex, rating, notes } = req.body as FeedbackPayload;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const conversation = await Conversation.findOne({ _id: id, userId: user.id });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await AuditLog.create({
      userId: user.id,
      action: `conversation:feedback_${rating}`,
      resource: id,
      ipAddress,
      userAgent,
      status: 'success',
      details: `MsgIdx: ${messageIndex}. Notes: ${notes || 'None'}`
    });

    return res.status(200).json({ message: 'Feedback logged successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error saving feedback' });
  }
};

export const uploadImage = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const user = req.user!;
  const ipAddress = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    fs.unlinkSync(file.path);
    return res.status(400).json({ error: 'Only PNG and JPEG formats are supported' });
  }

  try {
    await AuditLog.create({
      userId: user.id,
      action: 'conversation:image_upload',
      resource: file.originalname,
      ipAddress,
      userAgent,
      status: 'success',
      details: `Mime: ${file.mimetype}. Size: ${(file.size / 1024).toFixed(1)} KB`
    });

    return res.status(201).json({
      imageUrl: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      ocrReady: true
    });
  } catch (err: any) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(500).json({ error: 'Server error processing image' });
  }
};
