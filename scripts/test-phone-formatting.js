// Simple test script to validate phone number formatting
const { formatPhoneNumber } = require('../src/services/dataService.ts');

// Test cases from the problematic formats
const testCases = [
  // Truncated numbers
  { input: '0069540063', expected: '+33 6 95 40 06 3' },
  { input: '061410014', expected: '+33 6 14 10 01 4' },
  { input: '077692322', expected: '+33 7 76 92 32 2' },
  
  // Malformed +033 prefix
  { input: '+033610291377', expected: '+33 6 10 29 13 77' },
  { input: '+033613417984', expected: '+33 6 13 41 79 84' },
  { input: '+033622418387', expected: '+33 6 22 41 83 87' },
  { input: '+033646040048', expected: '+33 6 46 04 00 48' },
  { input: '+033652511146', expected: '+33 6 52 51 11 46' },
  { input: '+033695598663', expected: '+33 6 95 59 86 63' },
  { input: '+033762347191', expected: '+33 7 62 34 71 91' },
  { input: '+033782825070', expected: '+33 7 82 82 50 70' },
  
  // Numbers with extra digits
  { input: '06551215174', expected: '+33 6 55 12 15 17' },
  { input: '06652823324', expected: '+33 6 65 28 23 32' },
  
  // Malformed + prefix
  { input: '+06028208067', expected: '+33 6 02 82 08 06' },
  { input: '+062062089', expected: '+33 6 20 62 08 9' },
  { input: '+062662021', expected: '+33 6 26 62 02 1' },
  { input: '+062815205', expected: '+33 6 28 15 20 5' },
  { input: '+064975914', expected: '+33 6 49 75 91 4' },
  { input: '+065937025', expected: '+33 6 59 37 02 5' },
  { input: '+06619086667', expected: '+33 6 61 90 86 66' },
  { input: '+06695811507', expected: '+33 6 69 58 11 50' },
  { input: '+073367877', expected: '+33 7 33 67 87 7' },
  { input: '+07802753506', expected: '+33 7 80 27 53 50' },
  
  // Numbers with spaces
  { input: '07 64 87 78 96', expected: '+33 7 64 87 78 96' },
  { input: '06 64 87 78 96', expected: '+33 6 64 87 78 96' },
  
  // Existing formats (regression test)
  { input: '0612345678', expected: '+33 6 12 34 56 78' },
  { input: '+33612345678', expected: '+33 6 12 34 56 78' },
  { input: '612345678', expected: '+33 6 12 34 56 78' },
];

console.log('🧪 Testing Phone Number Formatting...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  try {
    const result = formatPhoneNumber(testCase.input);
    const success = result === testCase.expected;
    
    if (success) {
      console.log(`✅ Test ${index + 1}: '${testCase.input}' → '${result}'`);
      passed++;
    } else {
      console.log(`❌ Test ${index + 1}: '${testCase.input}' → '${result}' (expected: '${testCase.expected}')`);
      failed++;
    }
  } catch (error) {
    console.log(`💥 Test ${index + 1}: '${testCase.input}' → ERROR: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed.');
  process.exit(1);
}