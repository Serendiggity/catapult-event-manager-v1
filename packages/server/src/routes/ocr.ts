import { Router, Request, Response } from 'express';
import { OCRService } from '../services/ocr/ocr-service';
import { AIParsingResponse } from '../services/ocr/schemas';

const router = Router();

// Initialize OCR service with API key from environment
const ocrService = new OCRService(process.env.OPENAI_API_KEY || '');

interface ParseOCRTextRequest {
  ocrText: string;
  eventId?: string;
}

interface BatchParseOCRRequest {
  ocrTexts: string[];
  eventId?: string;
}

// Single OCR text parsing endpoint
router.post('/parse', async (req: Request<{}, {}, ParseOCRTextRequest>, res: Response) => {
  try {
    const { ocrText } = req.body;
    
    if (!ocrText || typeof ocrText !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: ocrText is required and must be a string' 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    const result = await ocrService.parseBusinessCardText(ocrText);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('OCR parsing error:', error);
    res.status(500).json({ 
      error: 'Failed to parse business card text',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Batch OCR text parsing endpoint
router.post('/parse-batch', async (req: Request<{}, {}, BatchParseOCRRequest>, res: Response) => {
  try {
    const { ocrTexts } = req.body;
    
    if (!Array.isArray(ocrTexts) || ocrTexts.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: ocrTexts must be a non-empty array' 
      });
    }

    if (ocrTexts.length > 50) {
      return res.status(400).json({ 
        error: 'Batch size too large. Maximum 50 items per batch' 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    const results = await ocrService.parseBusinessCardBatch(ocrTexts);
    
    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        needsReview: results.filter(r => 
          Object.values(r.parsedData).some(field => 
            field && field.value !== null && field.needsReview
          )
        ).length,
        failed: results.filter(r => r.overallConfidence === 0).length
      }
    });
  } catch (error) {
    console.error('Batch OCR parsing error:', error);
    res.status(500).json({ 
      error: 'Failed to parse batch of business cards',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint for development
router.post('/test', async (req: Request, res: Response) => {
  try {
    const testText = `John Smith
Senior Software Engineer
Acme Corporation
john.smith@acme.com
+1 (555) 123-4567`;

    const result = await ocrService.parseBusinessCardText(testText);
    
    res.json({
      success: true,
      testInput: testText,
      result
    });
  } catch (error) {
    console.error('OCR test error:', error);
    res.status(500).json({ 
      error: 'OCR test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;