import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { seedJccadDatabase } from '../utils/seeder';

function sanitizeMongodbUri(uri: string): string {
  if (!uri.startsWith('mongodb')) return uri;
  try {
    const lastAtIndex = uri.lastIndexOf('@');
    if (lastAtIndex === -1) return uri;
    const credentialsPart = uri.substring(0, lastAtIndex);
    const hostPart = uri.substring(lastAtIndex + 1);
    const protocolSeparator = '://';
    const protocolIndex = credentialsPart.indexOf(protocolSeparator);
    if (protocolIndex === -1) return uri;
    const protocol = credentialsPart.substring(0, protocolIndex + protocolSeparator.length);
    const userPass = credentialsPart.substring(protocolIndex + protocolSeparator.length);
    if (userPass.includes('@')) {
      const sanitizedUserPass = userPass.replace(/@/g, '%40');
      return `${protocol}${sanitizedUserPass}@${hostPart}`;
    }
  } catch (err) {
    // fallback
  }
  return uri;
}

function ensureDatabaseName(uri: string): string {
  try {
    const url = new URL(uri);
    const hasDatabaseName = url.pathname && url.pathname !== '/';
    if (hasDatabaseName) {
      return uri;
    }

    const defaultDatabaseName = process.env.MONGODB_DB || 'jccad_platform';
    url.pathname = `/${defaultDatabaseName}`;
    return url.toString();
  } catch {
    return uri;
  }
}

let isSeeded = false;
let connectionPromise: Promise<typeof mongoose> | null = null;
let databaseOfflineMode = false;

export async function connectDB(): Promise<typeof mongoose> {
  const rawMongodbUri = process.env.MONGODB_URI;
  if (!rawMongodbUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  const MONGODB_URI = ensureDatabaseName(sanitizeMongodbUri(rawMongodbUri));

  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    if (!isSeeded) {
      isSeeded = true;
      await seedJccadDatabase().catch(err => console.error('Seeding database failed:', err));
    }
    return mongoose;
  }

  // If currently connecting, await the existing promise
  if (mongoose.connection.readyState === 2 && connectionPromise) {
    return connectionPromise;
  }

  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  
  // Disable command buffering globally so queries fail fast when disconnected
  mongoose.set('bufferCommands', false);

  connectionPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  });

  try {
    await connectionPromise;
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    if (!isSeeded) {
      isSeeded = true;
      await seedJccadDatabase().catch(err => console.error('Seeding database failed:', err));
    }
    return mongoose;
  } catch (err) {
    connectionPromise = null; // Reset promise on failure so next request triggers retry
    databaseOfflineMode = true;
    throw err;
  }
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export const dbConnectionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (databaseOfflineMode || mongoose.connection.readyState === 1) {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err: any) {
    console.error('Database connection error in middleware:', err.message);
    console.warn(`Proceeding with local chat fallback for ${req.method} ${req.originalUrl}`);
    next();
  }
};
