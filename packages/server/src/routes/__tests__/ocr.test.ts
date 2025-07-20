import request from 'supertest';
import express from 'express';
import ocrRouter from '../ocr';
import { OCRService } from '../../services/ocr';

// Mock the OCR service
jest.mock('../../services/ocr');

describe('OCR Routes', () => {
  let app: express.Application;
  let mockOCRService: jest.Mocked<OCRService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/ocr', ocrRouter);
    
    // Setup mock
    mockOCRService = {
      parseBusinessCardText: jest.fn(),
      parseBusinessCardBatch: jest.fn(),
      toDatabaseFormat: jest.fn()
    } as any;
    
    (OCRService as jest.MockedClass<typeof OCRService>).mockImplementation(() => mockOCRService);
    
    // Set environment variable
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ocr/parse', () => {
    it('should successfully parse OCR text', async () => {
      const mockResponse = {
        parsedData: {
          firstName: { value: 'John', confidence: 0.95, needsReview: false },
          lastName: { value: 'Doe', confidence: 0.93, needsReview: false },
          email: { value: 'john@example.com', confidence: 0.98, needsReview: false },
          phone: { value: '555-1234', confidence: 0.88, needsReview: false },
          company: { value: 'Acme Corp', confidence: 0.91, needsReview: false },
          title: { value: 'Manager', confidence: 0.89, needsReview: false }
        },
        rawText: 'John Doe\nManager\nAcme Corp\njohn@example.com\n555-1234',
        overallConfidence: 0.91
      };

      mockOCRService.parseBusinessCardText.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ocr/parse')
        .send({ ocrText: 'John Doe\nManager\nAcme Corp\njohn@example.com\n555-1234' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
    });

    it('should return 400 for missing ocrText', async () => {
      const response = await request(app)
        .post('/api/ocr/parse')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ocrText is required');
    });

    it('should handle OCR service errors', async () => {
      mockOCRService.parseBusinessCardText.mockRejectedValue(new Error('OCR processing failed'));

      const response = await request(app)
        .post('/api/ocr/parse')
        .send({ ocrText: 'test text' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to parse business card text');
      expect(response.body.message).toBe('OCR processing failed');
    });
  });

  describe('POST /api/ocr/parse-batch', () => {
    it('should successfully parse multiple OCR texts', async () => {
      const mockResponses = [
        {
          parsedData: {
            firstName: { value: 'John', confidence: 0.95, needsReview: false },
            lastName: { value: 'Doe', confidence: 0.93, needsReview: false },
            email: { value: 'john@example.com', confidence: 0.98, needsReview: false },
            phone: { value: null, confidence: 0, needsReview: false },
            company: { value: null, confidence: 0, needsReview: false },
            title: { value: null, confidence: 0, needsReview: false }
          },
          rawText: 'John Doe\njohn@example.com',
          overallConfidence: 0.95
        },
        {
          parsedData: {
            firstName: { value: 'Jane', confidence: 0.65, needsReview: true },
            lastName: { value: 'Smith', confidence: 0.55, needsReview: true },
            email: { value: 'jane@example.com', confidence: 0.85, needsReview: false },
            phone: { value: '555-5678', confidence: 0.45, needsReview: true },
            company: { value: null, confidence: 0, needsReview: false },
            title: { value: null, confidence: 0, needsReview: false }
          },
          rawText: 'J@ne Sm1th\njane@example.com\n555-5678',
          overallConfidence: 0.62
        }
      ];

      mockOCRService.parseBusinessCardBatch.mockResolvedValue(mockResponses);

      const response = await request(app)
        .post('/api/ocr/parse-batch')
        .send({ 
          ocrTexts: [
            'John Doe\njohn@example.com',
            'J@ne Sm1th\njane@example.com\n555-5678'
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponses);
      expect(response.body.summary).toEqual({
        total: 2,
        needsReview: 1,
        failed: 0
      });
    });

    it('should reject batch sizes over 50', async () => {
      const response = await request(app)
        .post('/api/ocr/parse-batch')
        .send({ 
          ocrTexts: Array(51).fill('test text')
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Batch size too large');
    });
  });

  describe('POST /api/ocr/test', () => {
    it('should process test text successfully', async () => {
      const mockResponse = {
        parsedData: {
          firstName: { value: 'John', confidence: 0.95, needsReview: false },
          lastName: { value: 'Smith', confidence: 0.95, needsReview: false },
          email: { value: 'john.smith@acme.com', confidence: 0.98, needsReview: false },
          phone: { value: '+1 (555) 123-4567', confidence: 0.92, needsReview: false },
          company: { value: 'Acme Corporation', confidence: 0.93, needsReview: false },
          title: { value: 'Senior Software Engineer', confidence: 0.91, needsReview: false }
        },
        rawText: 'John Smith\nSenior Software Engineer\nAcme Corporation\njohn.smith@acme.com\n+1 (555) 123-4567',
        overallConfidence: 0.94
      };

      mockOCRService.parseBusinessCardText.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ocr/test')
        .send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.testInput).toBeDefined();
      expect(response.body.result).toEqual(mockResponse);
    });
  });
});