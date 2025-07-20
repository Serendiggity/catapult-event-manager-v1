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

// Configure CORS to allow multiple development ports
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178'
];

// Add any custom CORS_ORIGIN from env
if (process.env.CORS_ORIGIN && !allowedOrigins.includes(process.env.CORS_ORIGIN)) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: allowedOrigins
    }
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    api: true,
    timestamp: new Date().toISOString()
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
      console.log(`CORS enabled for multiple localhost ports (5173-5178)`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();