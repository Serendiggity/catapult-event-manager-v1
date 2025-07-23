import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import eventsRouter from './routes/events';
import ocrRouter from './routes/ocr';
import contactsRouter from './routes/contacts';
import campaignGroupsRouter from './routes/campaignGroups';
import emailCampaignsRouter from './routes/email-campaigns';
import adminRouter from './routes/admin';
import adminCreateTablesRouter from './routes/admin-create-tables';
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
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180'
];

// Add any custom CORS_ORIGIN from env
if (process.env.CORS_ORIGIN && !allowedOrigins.includes(process.env.CORS_ORIGIN)) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
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
app.use('/api/campaign-groups', campaignGroupsRouter);
app.use('/api', emailCampaignsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', adminCreateTablesRouter);

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Origin not allowed'
    });
  }

  // Handle database errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: 'Database connection error',
      message: 'Service temporarily unavailable'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Store server instance for graceful shutdown
let server: any;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    // Run migrations
    const { createQuickAddEvent } = await import('./db/migrations/create-quick-add-event');
    await createQuickAddEvent();
    
    server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`CORS enabled for multiple localhost ports (5173-5178)`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          // Import closeDatabase function
          const { closeDatabase } = await import('./db/connection');
          await closeDatabase();
          console.log('Database connections closed');
        } catch (error) {
          console.error('Error closing database:', error);
        }
        
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();