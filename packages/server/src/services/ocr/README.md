# OCR Service Documentation

## Overview

The OCR Service provides intelligent business card parsing using Tesseract.js for text extraction and OpenAI's GPT-4o-mini for field categorization and confidence scoring.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client App    │────▶│  Tesseract.js    │────▶│  OpenAI API     │
│  (Image Upload) │     │ (Text Extraction)│     │ (Field Parsing) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌──────────────────┐      ┌─────────────────┐
                        │   Raw OCR Text   │      │ Structured Data │
                        └──────────────────┘      │ with Confidence │
                                                  └─────────────────┘
```

## JSON Schema

### Input: Raw OCR Text
```
Plain text extracted from business card image
```

### Output: ParsedContactData
```typescript
{
  parsedData: {
    firstName: { value: string | null, confidence: 0-1, needsReview: boolean },
    lastName: { value: string | null, confidence: 0-1, needsReview: boolean },
    email: { value: string | null, confidence: 0-1, needsReview: boolean },
    phone: { value: string | null, confidence: 0-1, needsReview: boolean },
    company: { value: string | null, confidence: 0-1, needsReview: boolean },
    title: { value: string | null, confidence: 0-1, needsReview: boolean },
    address?: { value: string | null, confidence: 0-1, needsReview: boolean }
  },
  rawText: string,
  overallConfidence: 0-1,
  processingNotes?: string
}
```

## Confidence Scoring

- **Threshold**: 0.7 (fields below this are flagged for review)
- **Overall Confidence**: Average of all non-null field confidences
- **needsReview Flag**: Set to true when confidence < 0.7

## Prompt Engineering

### Design Principles

1. **Explicit Structure**: The prompt clearly defines the expected JSON output format
2. **Context Awareness**: Handles various business card layouts and formats
3. **Error Tolerance**: Accounts for common OCR errors (0/O, 1/l/I, rn/m confusion)
4. **Confidence Reporting**: Each field includes a confidence score

### Prompt Template

```javascript
const AI_PARSING_PROMPT = `You are an expert at parsing business card text...
[Full prompt in schemas.ts]
```

### Key Prompt Features

- **Role Definition**: "expert at parsing business card text"
- **Clear Instructions**: Step-by-step field extraction
- **Error Handling**: Guidelines for OCR error correction
- **Ambiguity Resolution**: "use context clues to disambiguate"
- **Output Format**: Exact JSON structure specification

## API Integration

### Endpoints

1. **Parse Single Card**
   - `POST /api/ocr/parse`
   - Body: `{ ocrText: string }`

2. **Batch Processing**
   - `POST /api/ocr/parse-batch`
   - Body: `{ ocrTexts: string[] }`
   - Max batch size: 50

3. **Create Contact from OCR**
   - `POST /api/contacts/ocr`
   - Body: `{ eventId: string, ocrText: string, imageUrl?: string }`

### Error Handling

- **Retry Logic**: 3 attempts with exponential backoff
- **Rate Limiting**: Batch processing with 5 concurrent requests
- **Fallback Response**: Returns empty fields with needsReview=true on failure

## Database Storage

### Contacts Table Extensions

```sql
-- Individual field confidence scores
field_confidence_scores JSONB

-- Address field for location data
address TEXT

-- Index for efficient review queries
CREATE INDEX idx_contacts_needs_review ON contacts(needs_review) 
WHERE needs_review = true;
```

## Usage Examples

### Basic Usage

```typescript
const ocrService = new OCRService(process.env.OPENAI_API_KEY);

// Single card parsing
const result = await ocrService.parseBusinessCardText(ocrText);

// Convert to database format
const dbData = ocrService.toDatabaseFormat(result.parsedData);
```

### Batch Processing

```typescript
const results = await ocrService.parseBusinessCardBatch(ocrTexts);
// Results include both successful and failed parsing attempts
```

## Testing

Test cases cover:
- Standard business cards
- OCR errors and typos
- Minimal information cards
- Complex multi-line layouts
- International formats

Run tests:
```bash
npm test -- ocr-service.test.ts
```

## Configuration

Required environment variables:
```
OPENAI_API_KEY=your_api_key_here
```

## Performance Considerations

- **Model**: GPT-4o-mini (fast, cost-effective)
- **Temperature**: 0.3 (consistent parsing)
- **Batch Size**: 5 concurrent requests
- **Retry Delay**: 1s, 2s, 4s (exponential backoff)

## Maintenance

### Updating the Prompt

1. Modify `AI_PARSING_PROMPT` in `schemas.ts`
2. Update test cases in `prompt-test-cases.ts`
3. Run tests to validate changes
4. Monitor confidence scores in production

### Adding New Fields

1. Update `ContactField` interface
2. Extend `ParsedContactData` type
3. Modify database schema
4. Update prompt to extract new field
5. Add validation logic

## Troubleshooting

### Low Confidence Scores
- Review OCR quality
- Check for unusual card formats
- Analyze `processingNotes` field

### High Review Rate
- Adjust confidence threshold
- Improve prompt specificity
- Add more test cases

### API Errors
- Verify API key configuration
- Check rate limits
- Monitor retry logs