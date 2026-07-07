import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

// Routes imports
import profileRoutes from './routes/profile';
import documentRoutes from './routes/document';
import knowledgeRoutes from './routes/knowledge';
import pipelineRoutes from './routes/pipeline';
import vectorRoutes from './routes/vector';
import retrievalRoutes from './routes/retrieval';
import orchestrationRoutes from './routes/orchestration';
import conversationRoutes from './routes/conversation';
import toolsRoutes from './routes/tools';
import { initializeGeminiModel } from './controllers/orchestration';
import { seedJccadDatabase } from './utils/seeder';

const app = express();
const PORT = process.env.PORT || 5000;
const rawMongodbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jccad_platform';

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

const MONGODB_URI = sanitizeMongodbUri(rawMongodbUri);

// Create uploads folder if not exists
const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite client dev server
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images static route
app.use('/uploads', express.static(uploadsDir));

// Route bindings
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/document', documentRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);
app.use('/api/v1/pipeline', pipelineRoutes);
app.use('/api/v1/vector', vectorRoutes);
app.use('/api/v1/retrieval', retrievalRoutes);
app.use('/api/v1/orchestration', orchestrationRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/tools', toolsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', services: ['database', 'indexing', 'orchestration'] });
});

// Database connection & listener initiation
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    
    // Seed database with official JCCAD profile content
    await seedJccadDatabase();
    
    // Initialize & validate Gemini Model configuration
    await initializeGeminiModel();

    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`JCCAD CIP Backend listening on port ${PORT}`);
      });
    }
  })
  .catch(async (err) => {
    console.error('Database connection failed. Starting server in offline test mode.');

    // Initialize & validate Gemini Model configuration
    await initializeGeminiModel();

    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`JCCAD CIP Backend listening in offline mode on port ${PORT}`);
      });
    }
  });

export default app;
