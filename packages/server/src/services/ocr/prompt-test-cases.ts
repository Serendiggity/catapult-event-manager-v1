export const OCR_TEST_CASES = [
  {
    description: "Standard business card with clear formatting",
    input: `John Smith
Senior Software Engineer
Acme Corporation
john.smith@acme.com
+1 (555) 123-4567
123 Main Street, Suite 100
San Francisco, CA 94105`,
    expectedOutput: {
      firstName: { value: "John", minConfidence: 0.9 },
      lastName: { value: "Smith", minConfidence: 0.9 },
      title: { value: "Senior Software Engineer", minConfidence: 0.9 },
      company: { value: "Acme Corporation", minConfidence: 0.9 },
      email: { value: "john.smith@acme.com", minConfidence: 0.95 },
      phone: { value: "+1 (555) 123-4567", minConfidence: 0.9 },
      address: { value: "123 Main Street, Suite 100, San Francisco, CA 94105", minConfidence: 0.85 }
    }
  },
  {
    description: "Business card with OCR errors",
    input: `J0hn Srnith
5enior 5oftware Engineer
Acrne C0rp0ration
john.srnith@acrne.corn
+l (555) l23-4567`,
    expectedOutput: {
      firstName: { value: "John", minConfidence: 0.7 },
      lastName: { value: "Smith", minConfidence: 0.7 },
      title: { value: "Senior Software Engineer", minConfidence: 0.65 },
      company: { value: "Acme Corporation", minConfidence: 0.6 },
      email: { value: "john.smith@acme.com", minConfidence: 0.65 },
      phone: { value: "+1 (555) 123-4567", minConfidence: 0.7 }
    }
  },
  {
    description: "Minimal business card",
    input: `Sarah Chen
sarah@example.com
555-9876`,
    expectedOutput: {
      firstName: { value: "Sarah", minConfidence: 0.9 },
      lastName: { value: "Chen", minConfidence: 0.9 },
      email: { value: "sarah@example.com", minConfidence: 0.95 },
      phone: { value: "555-9876", minConfidence: 0.85 },
      company: { value: null, minConfidence: 0 },
      title: { value: null, minConfidence: 0 }
    }
  },
  {
    description: "Complex layout with multiple lines",
    input: `MICHAEL RODRIGUEZ, MBA
Vice President of Marketing
Global Tech Solutions Inc.
Enterprise Software Division

Mobile: (555) 321-9876
Office: (555) 654-3210
Email: mrodriguez@globaltech.com
LinkedIn: linkedin.com/in/mrodriguez

1000 Technology Drive
Building A, Floor 15
Austin, TX 78701`,
    expectedOutput: {
      firstName: { value: "Michael", minConfidence: 0.85 },
      lastName: { value: "Rodriguez", minConfidence: 0.85 },
      title: { value: "Vice President of Marketing", minConfidence: 0.9 },
      company: { value: "Global Tech Solutions Inc.", minConfidence: 0.85 },
      email: { value: "mrodriguez@globaltech.com", minConfidence: 0.95 },
      phone: { value: "(555) 321-9876", minConfidence: 0.85 },
      address: { value: "1000 Technology Drive, Building A, Floor 15, Austin, TX 78701", minConfidence: 0.8 }
    }
  },
  {
    description: "Non-English characters and international format",
    input: `李明 (Ming Li)
产品经理 | Product Manager
创新科技有限公司
Innovation Tech Co., Ltd.
ming.li@innovtech.cn
+86 138 1234 5678`,
    expectedOutput: {
      firstName: { value: "Ming", minConfidence: 0.8 },
      lastName: { value: "Li", minConfidence: 0.8 },
      title: { value: "Product Manager", minConfidence: 0.85 },
      company: { value: "Innovation Tech Co., Ltd.", minConfidence: 0.8 },
      email: { value: "ming.li@innovtech.cn", minConfidence: 0.9 },
      phone: { value: "+86 138 1234 5678", minConfidence: 0.85 }
    }
  }
];

export function validateTestCase(actual: any, expected: any): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  for (const [field, expectedField] of Object.entries(expected)) {
    const actualField = actual.parsedData[field];
    
    if (!actualField) {
      errors.push(`Missing field: ${field}`);
      continue;
    }
    
    if (expectedField.value === null) {
      if (actualField.value !== null) {
        errors.push(`${field}: expected null, got "${actualField.value}"`);
      }
    } else {
      if (actualField.value !== expectedField.value && 
          !isCloseMatch(actualField.value, expectedField.value)) {
        errors.push(`${field}: expected "${expectedField.value}", got "${actualField.value}"`);
      }
      
      if (actualField.confidence < expectedField.minConfidence) {
        errors.push(`${field}: confidence ${actualField.confidence} below minimum ${expectedField.minConfidence}`);
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    errors
  };
}

function isCloseMatch(actual: string, expected: string): boolean {
  // Simple fuzzy matching for test validation
  if (!actual || !expected) return false;
  
  const normalizeString = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalizeString(actual).includes(normalizeString(expected)) ||
         normalizeString(expected).includes(normalizeString(actual));
}