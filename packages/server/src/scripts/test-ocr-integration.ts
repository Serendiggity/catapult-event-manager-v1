import { OCRService } from '../services/ocr/ocr-service';
import { OCR_TEST_CASES, validateTestCase } from '../services/ocr/prompt-test-cases';
import dotenv from 'dotenv';

dotenv.config();

async function testOCRIntegration() {
  console.log('🔍 Testing OCR Integration with OpenAI\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }

  const ocrService = new OCRService(process.env.OPENAI_API_KEY);
  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of OCR_TEST_CASES) {
    console.log(`\n📋 Test Case: ${testCase.description}`);
    console.log('Input OCR Text:');
    console.log('---');
    console.log(testCase.input);
    console.log('---\n');

    try {
      const result = await ocrService.parseBusinessCardText(testCase.input);
      
      console.log('✅ Successfully parsed!');
      console.log(`Overall Confidence: ${(result.overallConfidence * 100).toFixed(1)}%`);
      
      // Validate results
      const validation = validateTestCase(result, testCase.expectedOutput);
      
      if (validation.passed) {
        console.log('✅ All fields extracted correctly');
        passedTests++;
      } else {
        console.log('❌ Validation errors:');
        validation.errors.forEach(error => console.log(`   - ${error}`));
        failedTests++;
      }
      
      // Show parsed data
      console.log('\nParsed Contact Data:');
      const fields = ['firstName', 'lastName', 'email', 'phone', 'company', 'title', 'address'];
      
      for (const field of fields) {
        const fieldData = result.parsedData[field as keyof typeof result.parsedData];
        if (fieldData && fieldData.value) {
          const confidence = (fieldData.confidence * 100).toFixed(0);
          const needsReview = fieldData.needsReview ? ' ⚠️ (needs review)' : '';
          console.log(`  ${field}: ${fieldData.value} [${confidence}%]${needsReview}`);
        }
      }
      
      // Show fields needing review
      const reviewFields = fields.filter(field => {
        const fieldData = result.parsedData[field as keyof typeof result.parsedData];
        return fieldData && fieldData.needsReview;
      });
      
      if (reviewFields.length > 0) {
        console.log(`\n⚠️  Fields needing review: ${reviewFields.join(', ')}`);
      }
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      failedTests++;
    }
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / OCR_TEST_CASES.length) * 100).toFixed(1)}%`);
}

// Run the test
testOCRIntegration().catch(console.error);