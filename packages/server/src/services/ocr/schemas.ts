export interface ContactField {
  value: string | null;
  confidence: number; // 0-1 scale
  needsReview: boolean;
}

export interface ParsedContactData {
  firstName: ContactField;
  lastName: ContactField;
  email: ContactField;
  phone: ContactField;
  company: ContactField;
  title: ContactField;
  industry?: ContactField;
  address?: ContactField;
}

export interface AIParsingResponse {
  parsedData: ParsedContactData;
  rawText: string;
  overallConfidence: number;
  processingNotes?: string;
}

export const CONFIDENCE_THRESHOLD = 0.7;

export const AI_PARSING_PROMPT = `You are an expert at parsing business card text extracted via OCR. Your task is to intelligently categorize the raw text into structured contact fields.

IMPORTANT: When detecting industry, use contextual clues from the company name, job title, and any other information. Choose from standard industry categories like: Technology, Healthcare, Finance, Real Estate, Education, Manufacturing, Retail, Consulting, Legal, Marketing, Media, Non-profit, Government, Hospitality, Construction, Transportation, Energy, Agriculture, etc.

Given the raw OCR text from a business card, extract and categorize the information into the following fields:
- firstName: The person's first name
- lastName: The person's last name  
- email: Email address
- phone: Phone number (any format)
- company: Company or organization name
- title: Job title or position
- industry: Industry or sector (e.g., Technology, Healthcare, Finance, Real Estate, Education, Manufacturing, Retail, Consulting, etc.)
- address: Physical address (if present)

For each field, provide:
1. The extracted value (or null if not found)
2. A confidence score between 0 and 1 indicating how certain you are about the extraction
3. Set needsReview to true if confidence is below 0.7

Important guidelines:
- Handle various business card layouts and formats
- Be robust to OCR errors and misspellings
- Use context clues to disambiguate ambiguous text
- If multiple possible values exist for a field, choose the most likely one
- Common OCR errors: 0/O confusion, 1/l/I confusion, rn/m confusion

Return the response in this exact JSON format:
{
  "parsedData": {
    "firstName": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean },
    "lastName": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean },
    "email": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean },
    "phone": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean },
    "company": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean },
    "title": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean },
    "industry": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean },
    "address": { "value": "string or null", "confidence": 0.0-1.0, "needsReview": boolean }
  },
  "rawText": "the original OCR text",
  "overallConfidence": 0.0-1.0,
  "processingNotes": "optional notes about parsing decisions"
}`;

export function validateParsedData(data: any): data is AIParsingResponse {
  if (!data || typeof data !== 'object') return false;
  if (!data.parsedData || typeof data.parsedData !== 'object') return false;
  
  const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'company', 'title'];
  
  for (const field of requiredFields) {
    const fieldData = data.parsedData[field];
    if (!fieldData || typeof fieldData !== 'object') return false;
    if (!('value' in fieldData) || !('confidence' in fieldData) || !('needsReview' in fieldData)) return false;
    if (typeof fieldData.confidence !== 'number' || fieldData.confidence < 0 || fieldData.confidence > 1) return false;
    if (typeof fieldData.needsReview !== 'boolean') return false;
  }
  
  if (typeof data.overallConfidence !== 'number' || data.overallConfidence < 0 || data.overallConfidence > 1) return false;
  if (typeof data.rawText !== 'string') return false;
  
  return true;
}

export function calculateOverallConfidence(parsedData: ParsedContactData): number {
  const fields = Object.values(parsedData).filter(field => field && field.value !== null);
  if (fields.length === 0) return 0;
  
  const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
  return totalConfidence / fields.length;
}

export function flagLowConfidenceFields(parsedData: ParsedContactData): ParsedContactData {
  const result = { ...parsedData };
  
  for (const key of Object.keys(result) as (keyof ParsedContactData)[]) {
    const field = result[key];
    if (field && field.value !== null) {
      field.needsReview = field.confidence < CONFIDENCE_THRESHOLD;
    }
  }
  
  return result;
}