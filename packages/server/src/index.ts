import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events';
import ocrRouter from './routes/ocr';
import contactsRouter from './routes/contacts';
import leadGroupsRouter from './routes/leadGroups';
import emailCampaignsRouter from './routes/email-campaigns';
import { initializeDatabase } from './db/connection';

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS with proper options for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Catapult Event Manager API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/events', eventsRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/lead-groups', leadGroupsRouter);
app.use('/api', emailCampaignsRouter);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS enabled for: ${corsOptions.origin}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();