import 'dotenv/config';
import express from 'express';
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
import { connectDB, dbConnectionMiddleware } from './middleware/db';

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads folder if not exists
const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not permitted by CORS`));
      }
    : true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images static route
app.use('/uploads', express.static(uploadsDir));

// Database connectivity check for API routes
app.use('/api', dbConnectionMiddleware);

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

// Initialize database connection dynamically. 
// For non-vercel environments, start server listener.
if (!process.env.VERCEL) {
  connectDB()
    .then(async () => {
      await initializeGeminiModel();
      app.listen(PORT, () => {
        console.log(`JCCAD CIP Backend listening on port ${PORT}`);
      });
    })
    .catch(async (err) => {
      console.error('Database connection failed. Starting server in offline test mode.');
      await initializeGeminiModel();
      app.listen(PORT, () => {
        console.log(`JCCAD CIP Backend listening in offline mode on port ${PORT}`);
      });
    });
} else {
  // In serverless environment, pre-initialize the model configuration asynchronously
  initializeGeminiModel().catch(err => console.error('Failed to initialize Gemini model:', err));
}

export default app;
