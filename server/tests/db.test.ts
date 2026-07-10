import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { connectDB, dbConnectionMiddleware } from '../src/middleware/db';

describe('Database Connectivity and Middleware Tests', () => {
  const originalEnv = process.env.MONGODB_URI;

  beforeAll(async () => {
    // Save original URI
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:9999/offline_test_db';
    await mongoose.disconnect();
  });

  afterAll(async () => {
    process.env.MONGODB_URI = originalEnv;
    await mongoose.disconnect();
  });

  it('should fail fast when connecting to an offline or invalid URI', async () => {
    const startTime = Date.now();
    let error: any = null;
    try {
      await connectDB();
    } catch (err: any) {
      error = err;
    }
    const elapsed = Date.now() - startTime;

    expect(error).toBeDefined();
    // Ensure it fails fast (less than the standard 30 seconds Mongoose timeout)
    expect(elapsed).toBeLessThan(10000);
  });

  it('should immediately return a 503 response if database connection fails in the middleware', async () => {
    const mockReq = {} as Request;
    let statusSet: number | null = null;
    let responseJson: any = null;

    const mockRes = {
      status(s: number) {
        statusSet = s;
        return this;
      },
      json(j: any) {
        responseJson = j;
        return this;
      }
    } as unknown as Response;

    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    await dbConnectionMiddleware(mockReq, mockRes, next);

    expect(nextCalled).toBe(false);
    expect(statusSet).toBe(503);
    expect(responseJson).toBeDefined();
    expect(responseJson.error).toBe('System databases are currently offline. Retrying connection...');
  });
});
