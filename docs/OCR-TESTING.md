# OCR Testing Guide

## Overview

This guide explains how to test the OCR functionality with AI-enhanced field parsing.

## Prerequisites

1. **OpenAI API Key**: Ensure `OPENAI_API_KEY` is set in your `.env` file
2. **Running Services**: Both server and client should be running
3. **Test Event**: Create at least one event in the system

## Testing Workflow

### 1. Start the Services

```bash
# Terminal 1 - Start the server
cd packages/server
npm run dev

# Terminal 2 - Start the client
cd packages/client
npm run dev
```

### 2. Test OCR Processing

#### Unit Tests
```bash
cd packages/server
npm test -- ocr.test.ts
```

#### Integration Test
```bash
cd packages/server
npx tsx src/scripts/test-ocr-integration.ts
```

### 3. Manual Testing via UI

1. **Navigate to Events Page**
   - Go to http://localhost:5173
   - Click on an event

2. **Add Contact with Business Card**
   - Click "Add Contact" button
   - Choose either:
     - **Camera**: Take a photo (mobile) or use webcam (desktop)
     - **Upload**: Select an image file

3. **OCR Processing**
   - Watch the processing steps:
     - Text extraction (Tesseract.js)
     - AI parsing (OpenAI)
     - Contact saving

4. **Review Queue**
   - Click "Review Queue" button
   - See contacts with low-confidence fields
   - Click "Review" to correct any fields

### 4. Test Cases

#### Standard Business Card
```
John Smith
Senior Software Engineer
Acme Corporation
john.smith@acme.com
+1 (555) 123-4567
123 Main Street, Suite 100
San Francisco, CA 94105
```

#### Business Card with OCR Errors
```
J0hn Srnith
5enior 5oftware Engineer
Acrne C0rp0ration
john.srnith@acrne.corn
+l (555) l23-4567
```

#### Minimal Information
```
Sarah Chen
sarah@example.com
555-9876
```

#### Complex Layout
```
MICHAEL RODRIGUEZ, MBA
Vice President of Marketing
Global Tech Solutions Inc.
Enterprise Software Division

Mobile: (555) 321-9876
Office: (555) 654-3210
Email: mrodriguez@globaltech.com
LinkedIn: linkedin.com/in/mrodriguez

1000 Technology Drive
Building A, Floor 15
Austin, TX 78701
```

## API Testing

### Single OCR Processing
```bash
curl -X POST http://localhost:3001/api/ocr/parse \
  -H "Content-Type: application/json" \
  -d '{
    "ocrText": "John Smith\nSenior Engineer\nAcme Corp\njohn@acme.com\n555-1234"
  }'
```

### Batch Processing
```bash
curl -X POST http://localhost:3001/api/ocr/parse-batch \
  -H "Content-Type: application/json" \
  -d '{
    "ocrTexts": [
      "John Doe\njohn@example.com",
      "Jane Smith\njane@example.com\n555-5678"
    ]
  }'
```

### Create Contact from OCR
```bash
curl -X POST http://localhost:3001/api/contacts/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "YOUR_EVENT_ID",
    "ocrText": "John Smith\nManager\nAcme Corp\njohn@acme.com"
  }'
```

### Get Review Queue
```bash
curl http://localhost:3001/api/contacts/needs-review?eventId=YOUR_EVENT_ID
```

## Expected Results

### Confidence Thresholds
- **High Confidence (≥ 0.7)**: Field accepted automatically
- **Low Confidence (< 0.7)**: Field flagged for manual review

### Common Issues Detected
- OCR errors (0/O, 1/l/I confusion)
- Missing fields
- Ambiguous text placement
- Non-standard formats

### Performance Metrics
- Text extraction: 2-5 seconds
- AI parsing: 1-3 seconds
- Total processing: 3-8 seconds per card

## Troubleshooting

### OpenAI API Errors
- Check API key is valid
- Verify rate limits haven't been exceeded
- Check internet connectivity

### Low Confidence Scores
- Ensure good image quality
- Proper lighting for camera capture
- Clear, readable business cards

### Missing Fields
- AI may not detect non-standard layouts
- Manual review queue will catch these

## Test Data

Sample business card images are not included but you can:
1. Use your own business cards
2. Create test cards with the text samples above
3. Use online business card generators

## Monitoring

Check server logs for:
- OCR processing times
- API call success/failure
- Confidence score distributions
- Review queue statistics