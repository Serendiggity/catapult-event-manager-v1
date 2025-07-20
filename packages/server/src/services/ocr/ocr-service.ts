import OpenAI from 'openai';
import { 
  AIParsingResponse, 
  AI_PARSING_PROMPT, 
  validateParsedData,
  calculateOverallConfidence,
  flagLowConfidenceFields,
  ParsedContactData
} from './schemas';

export class OCRService {
  private openai: OpenAI;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async parseBusinessCardText(ocrText: string): Promise<AIParsingResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.callOpenAI(ocrText);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.error(`OCR parsing attempt ${attempt + 1} failed:`, error);
        
        if (attempt < this.maxRetries - 1) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`Failed to parse business card after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  private async callOpenAI(ocrText: string): Promise<AIParsingResponse> {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: AI_PARSING_PROMPT
        },
        {
          role: "user",
          content: `Parse this business card OCR text:\n\n${ocrText}`
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent parsing
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${content}`);
    }

    if (!validateParsedData(parsedResponse)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Apply confidence threshold flagging
    parsedResponse.parsedData = flagLowConfidenceFields(parsedResponse.parsedData);
    
    // Ensure overall confidence is calculated
    if (!parsedResponse.overallConfidence) {
      parsedResponse.overallConfidence = calculateOverallConfidence(parsedResponse.parsedData);
    }

    return parsedResponse;
  }

  async parseBusinessCardBatch(ocrTexts: string[]): Promise<AIParsingResponse[]> {
    // Process in parallel with rate limiting
    const batchSize = 5; // Process 5 at a time to avoid rate limits
    const results: AIParsingResponse[] = [];
    
    for (let i = 0; i < ocrTexts.length; i += batchSize) {
      const batch = ocrTexts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.parseBusinessCardText(text));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create a fallback response for failed parsing
          results.push(this.createFallbackResponse(batch[j], result.reason));
        }
      }
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < ocrTexts.length) {
        await this.sleep(1000);
      }
    }
    
    return results;
  }

  private createFallbackResponse(ocrText: string, error: any): AIParsingResponse {
    const emptyField = { value: null, confidence: 0, needsReview: true };
    
    return {
      parsedData: {
        firstName: emptyField,
        lastName: emptyField,
        email: emptyField,
        phone: emptyField,
        company: emptyField,
        title: emptyField,
      },
      rawText: ocrText,
      overallConfidence: 0,
      processingNotes: `Failed to parse: ${error.message || 'Unknown error'}`
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to convert parsed data to database format
  toDatabaseFormat(parsedData: ParsedContactData) {
    return {
      firstName: parsedData.firstName.value,
      lastName: parsedData.lastName.value,
      email: parsedData.email.value,
      phone: parsedData.phone.value,
      company: parsedData.company.value,
      title: parsedData.title.value,
      // Calculate if any field needs review
      needsReview: Object.values(parsedData).some(field => 
        field && field.value !== null && field.needsReview
      ),
      // Store confidence scores as JSON metadata
      confidenceScores: {
        firstName: parsedData.firstName.confidence,
        lastName: parsedData.lastName.confidence,
        email: parsedData.email.confidence,
        phone: parsedData.phone.confidence,
        company: parsedData.company.confidence,
        title: parsedData.title.confidence,
        address: parsedData.address?.confidence
      }
    };
  }
}