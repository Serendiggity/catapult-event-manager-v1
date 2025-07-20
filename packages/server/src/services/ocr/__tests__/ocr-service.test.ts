import { OCRService } from '../ocr-service';
import { OCR_TEST_CASES, validateTestCase } from '../prompt-test-cases';

// Mock OpenAI for testing
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('OCRService', () => {
  let ocrService: OCRService;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    ocrService = new OCRService('test-api-key');
    const OpenAI = require('openai').default;
    mockCreate = OpenAI.mock.results[0].value.chat.completions.create;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseBusinessCardText', () => {
    it('should parse a standard business card successfully', async () => {
      const testCase = OCR_TEST_CASES[0];
      const mockResponse = {
        parsedData: {
          firstName: { value: "John", confidence: 0.95, needsReview: false },
          lastName: { value: "Smith", confidence: 0.95, needsReview: false },
          email: { value: "john.smith@acme.com", confidence: 0.98, needsReview: false },
          phone: { value: "+1 (555) 123-4567", confidence: 0.92, needsReview: false },
          company: { value: "Acme Corporation", confidence: 0.93, needsReview: false },
          title: { value: "Senior Software Engineer", confidence: 0.91, needsReview: false },
          address: { value: "123 Main Street, Suite 100, San Francisco, CA 94105", confidence: 0.87, needsReview: false }
        },
        rawText: testCase.input,
        overallConfidence: 0.93
      };

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify(mockResponse)
          }
        }]
      });

      const result = await ocrService.parseBusinessCardText(testCase.input);
      
      expect(result.parsedData.firstName.value).toBe("John");
      expect(result.parsedData.email.value).toBe("john.smith@acme.com");
      expect(result.overallConfidence).toBeGreaterThan(0.9);
    });

    it('should flag low confidence fields for review', async () => {
      const mockResponse = {
        parsedData: {
          firstName: { value: "John", confidence: 0.65, needsReview: false },
          lastName: { value: "Smith", confidence: 0.55, needsReview: false },
          email: { value: "john@example.com", confidence: 0.85, needsReview: false },
          phone: { value: "555-1234", confidence: 0.45, needsReview: false },
          company: { value: null, confidence: 0, needsReview: false },
          title: { value: null, confidence: 0, needsReview: false }
        },
        rawText: "J0hn Sm1th\njohn@example.com\n555-1234",
        overallConfidence: 0.58
      };

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify(mockResponse)
          }
        }]
      });

      const result = await ocrService.parseBusinessCardText("J0hn Sm1th\njohn@example.com\n555-1234");
      
      expect(result.parsedData.firstName.needsReview).toBe(true);
      expect(result.parsedData.lastName.needsReview).toBe(true);
      expect(result.parsedData.phone.needsReview).toBe(true);
      expect(result.parsedData.email.needsReview).toBe(false); // Above threshold
    });

    it('should retry on API failure', async () => {
      mockCreate
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                parsedData: {
                  firstName: { value: "Test", confidence: 0.9, needsReview: false },
                  lastName: { value: "User", confidence: 0.9, needsReview: false },
                  email: { value: "test@example.com", confidence: 0.95, needsReview: false },
                  phone: { value: null, confidence: 0, needsReview: false },
                  company: { value: null, confidence: 0, needsReview: false },
                  title: { value: null, confidence: 0, needsReview: false }
                },
                rawText: "Test User\ntest@example.com",
                overallConfidence: 0.85
              })
            }
          }]
        });

      const result = await ocrService.parseBusinessCardText("Test User\ntest@example.com");
      
      expect(mockCreate).toHaveBeenCalledTimes(3);
      expect(result.parsedData.firstName.value).toBe("Test");
    });

    it('should throw error after max retries', async () => {
      mockCreate.mockRejectedValue(new Error('Persistent API error'));

      await expect(
        ocrService.parseBusinessCardText("Test text")
      ).rejects.toThrow('Failed to parse business card after 3 attempts');
      
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });

  describe('parseBusinessCardBatch', () => {
    it('should process multiple cards in batches', async () => {
      const mockResponses = Array(7).fill(null).map((_, i) => ({
        parsedData: {
          firstName: { value: `User${i}`, confidence: 0.9, needsReview: false },
          lastName: { value: `Test${i}`, confidence: 0.9, needsReview: false },
          email: { value: `user${i}@example.com`, confidence: 0.95, needsReview: false },
          phone: { value: null, confidence: 0, needsReview: false },
          company: { value: null, confidence: 0, needsReview: false },
          title: { value: null, confidence: 0, needsReview: false }
        },
        rawText: `User${i} Test${i}`,
        overallConfidence: 0.85
      }));

      mockResponses.forEach(response => {
        mockCreate.mockResolvedValueOnce({
          choices: [{
            message: { content: JSON.stringify(response) }
          }]
        });
      });

      const inputs = Array(7).fill(null).map((_, i) => `User${i} Test${i}`);
      const results = await ocrService.parseBusinessCardBatch(inputs);
      
      expect(results).toHaveLength(7);
      expect(results[0].parsedData.firstName.value).toBe('User0');
      expect(results[6].parsedData.firstName.value).toBe('User6');
    });

    it('should handle partial batch failures gracefully', async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                parsedData: {
                  firstName: { value: "Success", confidence: 0.9, needsReview: false },
                  lastName: { value: "User", confidence: 0.9, needsReview: false },
                  email: { value: null, confidence: 0, needsReview: false },
                  phone: { value: null, confidence: 0, needsReview: false },
                  company: { value: null, confidence: 0, needsReview: false },
                  title: { value: null, confidence: 0, needsReview: false }
                },
                rawText: "Success User",
                overallConfidence: 0.9
              })
            }
          }]
        })
        .mockRejectedValue(new Error('API Error'));

      const results = await ocrService.parseBusinessCardBatch(['Success User', 'Failed Card']);
      
      expect(results).toHaveLength(2);
      expect(results[0].parsedData.firstName.value).toBe('Success');
      expect(results[1].overallConfidence).toBe(0); // Fallback response
      expect(results[1].processingNotes).toContain('Failed to parse');
    });
  });

  describe('toDatabaseFormat', () => {
    it('should convert parsed data to database format', () => {
      const parsedData = {
        firstName: { value: "John", confidence: 0.95, needsReview: false },
        lastName: { value: "Doe", confidence: 0.93, needsReview: false },
        email: { value: "john@example.com", confidence: 0.98, needsReview: false },
        phone: { value: "555-1234", confidence: 0.65, needsReview: true },
        company: { value: "Acme Corp", confidence: 0.88, needsReview: false },
        title: { value: "Manager", confidence: 0.91, needsReview: false }
      };

      const dbFormat = ocrService.toDatabaseFormat(parsedData);
      
      expect(dbFormat.firstName).toBe("John");
      expect(dbFormat.lastName).toBe("Doe");
      expect(dbFormat.needsReview).toBe(true); // Because phone needs review
      expect(dbFormat.confidenceScores.email).toBe(0.98);
    });
  });
});