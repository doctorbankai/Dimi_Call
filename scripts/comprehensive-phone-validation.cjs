#!/usr/bin/env node

/**
 * Comprehensive Phone Number Formatting Validation Script
 * 
 * This script validates the enhanced formatPhoneNumber function against
 * all identified problematic formats and provides detailed reporting.
 * 
 * Usage: node scripts/comprehensive-phone-validation.cjs [--verbose] [--benchmark]
 */

const fs = require('fs');
const path = require('path');

// Enhanced formatPhoneNumber function (copy from implementation)
function formatPhoneNumber(phoneStr) {
  // Handle null, undefined, or empty inputs
  if (!phoneStr || typeof phoneStr !== 'string') return '';
  
  // Clean all characters except digits and +
  let cleaned = phoneStr.replace(/[^\d+]/g, "");
  
  // Early return for empty cleaned string
  if (!cleaned) return phoneStr;

  // Pattern 1: Malformed +033 prefix (high priority)
  const matchMalformed033 = cleaned.match(/^\+033(\d{9,10})$/);
  if (matchMalformed033) {
    const digits = matchMalformed033[1];
    // If 10 digits, take first 9; if 9 digits, use as is
    const num = digits.length === 10 ? digits.slice(0, 9) : digits;
    if (num.length === 9) {
      return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
    }
  }

  // Pattern 2: Malformed +0 prefix
  const matchMalformedPlus0 = cleaned.match(/^\+0([67]\d{7,9})$/);
  if (matchMalformedPlus0) {
    const digits = matchMalformedPlus0[1];
    // Handle both truncated (8 digits) and normal (9 digits) and extra (10+ digits)
    if (digits.length >= 8) {
      const num = digits.length === 8 ? digits : digits.slice(0, 9);
      if (num.length === 8) {
        // Truncated mobile number
        return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
      } else {
        // Standard 9-digit mobile
        return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
      }
    }
  }

  // Pattern 3: Numbers with extra digits (11 digits starting with 0)
  const matchExtraDigits = cleaned.match(/^0([67]\d{9})$/);
  if (matchExtraDigits) {
    const digits = matchExtraDigits[1];
    // Take first 9 digits
    const num = digits.slice(0, 9);
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 4: Truncated numbers (9 digits starting with 0, mobile/landline)
  const matchTruncated = cleaned.match(/^0([67]\d{7})$/);
  if (matchTruncated) {
    const num = matchTruncated[1];
    // Format as truncated with last digit isolated
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
  }

  // Pattern 4b: Special case for numbers like '0069540063' (10 digits but should be truncated)
  // This handles cases where the number starts with 00 followed by mobile prefix
  const matchSpecialTruncated = cleaned.match(/^00([67]\d{7})$/);
  if (matchSpecialTruncated) {
    const num = matchSpecialTruncated[1];
    // Format as truncated with last digit isolated
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
  }

  // Pattern 5: Standard +33(0) format - remove the 0 after +33
  if (cleaned.match(/^\+330/)) {
    cleaned = cleaned.replace(/^\+330/, '+33');
  }

  // Pattern 6: Number without + before 33
  if (cleaned.match(/^33\d{9}$/)) {
    cleaned = '+' + cleaned;
  }

  // Pattern 7: Already correct +33 format with 9 digits
  const matchCorrectPlus33 = cleaned.match(/^\+33(\d{9})$/);
  if (matchCorrectPlus33) {
    const num = matchCorrectPlus33[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 8: Standard 10-digit number starting with 0
  const matchStandard10 = cleaned.match(/^0(\d{9})$/);
  if (matchStandard10) {
    const num = matchStandard10[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 9: 9-digit mobile numbers (6 or 7 prefix)
  const matchMobile9 = cleaned.match(/^([67]\d{8})$/);
  if (matchMobile9) {
    const num = matchMobile9[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 10: 9-digit landline numbers (1-5 prefix)
  const matchLandline9 = cleaned.match(/^([1-5]\d{8})$/);
  if (matchLandline9) {
    const num = matchLandline9[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7,9)}`;
  }

  // Pattern 11: 8-digit mobile numbers (truncated, no leading 0)
  const matchTruncatedMobile = cleaned.match(/^([67]\d{7})$/);
  if (matchTruncatedMobile) {
    const num = matchTruncatedMobile[1];
    return `+33 ${num[0]} ${num.slice(1,3)} ${num.slice(3,5)} ${num.slice(5,7)} ${num.slice(7)}`;
  }

  // Pattern 12: +33 with malformed digits (handle extra 0s or irregular lengths)
  const matchPlus33Variant = cleaned.match(/^\+33(.+)$/);
  if (matchPlus33Variant) {
    let numPart = matchPlus33Variant[1];
    
    // Remove leading 0s
    while (numPart.startsWith('0') && numPart.length > 9) {
      numPart = numPart.substring(1);
    }
    
    // If exactly 9 digits, format normally
    if (numPart.length === 9) {
      return `+33 ${numPart[0]} ${numPart.slice(1,3)} ${numPart.slice(3,5)} ${numPart.slice(5,7)} ${numPart.slice(7,9)}`;
    }
    
    // If 8 digits and starts with 6/7, format as truncated mobile
    if (numPart.length === 8 && /^[67]/.test(numPart)) {
      return `+33 ${numPart[0]} ${numPart.slice(1,3)} ${numPart.slice(3,5)} ${numPart.slice(5,7)} ${numPart.slice(7)}`;
    }
    
    // If more than 9 digits, take first 9
    if (numPart.length > 9) {
      const truncated = numPart.slice(0, 9);
      return `+33 ${truncated[0]} ${truncated.slice(1,3)} ${truncated.slice(3,5)} ${truncated.slice(5,7)} ${truncated.slice(7,9)}`;
    }
  }

  // If no pattern matches, return original input
  return phoneStr;
}

// Comprehensive test suite
const testSuites = {
  'Original Problematic Formats': [
    { input: '0069540063', expected: '+33 6 95 40 06 3', description: 'Truncated with 00 prefix' },
    { input: '061410014', expected: '+33 6 14 10 01 4', description: 'Truncated mobile' },
    { input: '06551215174', expected: '+33 6 55 12 15 17', description: 'Extra digit' },
    { input: '06652823324', expected: '+33 6 65 28 23 32', description: 'Extra digit' },
    { input: '077692322', expected: '+33 7 76 92 32 2', description: 'Truncated mobile' },
    { input: '+033610291377', expected: '+33 6 10 29 13 77', description: 'Malformed +033 prefix' },
    { input: '+033613417984', expected: '+33 6 13 41 79 84', description: 'Malformed +033 prefix' },
    { input: '+033622418387', expected: '+33 6 22 41 83 87', description: 'Malformed +033 prefix' },
    { input: '+033646040048', expected: '+33 6 46 04 00 48', description: 'Malformed +033 prefix' },
    { input: '+033652511146', expected: '+33 6 52 51 11 46', description: 'Malformed +033 prefix' },
    { input: '+033695598663', expected: '+33 6 95 59 86 63', description: 'Malformed +033 prefix' },
    { input: '+033762347191', expected: '+33 7 62 34 71 91', description: 'Malformed +033 prefix' },
    { input: '+033782825070', expected: '+33 7 82 82 50 70', description: 'Malformed +033 prefix' },
    { input: '+06028208067', expected: '+33 6 02 82 08 06', description: 'Malformed +0 prefix' },
    { input: '+062062089', expected: '+33 6 20 62 08 9', description: 'Malformed +0 prefix (truncated)' },
    { input: '+062662021', expected: '+33 6 26 62 02 1', description: 'Malformed +0 prefix (truncated)' },
    { input: '+062815205', expected: '+33 6 28 15 20 5', description: 'Malformed +0 prefix (truncated)' },
    { input: '+064975914', expected: '+33 6 49 75 91 4', description: 'Malformed +0 prefix (truncated)' },
    { input: '+065937025', expected: '+33 6 59 37 02 5', description: 'Malformed +0 prefix (truncated)' },
    { input: '+06619086667', expected: '+33 6 61 90 86 66', description: 'Malformed +0 prefix' },
    { input: '+06695811507', expected: '+33 6 69 58 11 50', description: 'Malformed +0 prefix' },
    { input: '+073367877', expected: '+33 7 33 67 87 7', description: 'Malformed +0 prefix (truncated)' },
    { input: '+07802753506', expected: '+33 7 80 27 53 50', description: 'Malformed +0 prefix' },
    { input: '07 64 87 78 96', expected: '+33 7 64 87 78 96', description: 'With spaces' },
    { input: '06 64 87 78 96', expected: '+33 6 64 87 78 96', description: 'With spaces' }
  ],
  
  'Standard Formats (Regression)': [
    { input: '0612345678', expected: '+33 6 12 34 56 78', description: 'Standard 10-digit mobile' },
    { input: '0123456789', expected: '+33 1 23 45 67 89', description: 'Standard 10-digit landline' },
    { input: '+33612345678', expected: '+33 6 12 34 56 78', description: 'Already formatted +33' },
    { input: '+330612345678', expected: '+33 6 12 34 56 78', description: '+33(0) format' },
    { input: '33612345678', expected: '+33 6 12 34 56 78', description: '33 without +' },
    { input: '612345678', expected: '+33 6 12 34 56 78', description: '9-digit mobile' },
    { input: '123456789', expected: '+33 1 23 45 67 89', description: '9-digit landline' }
  ],
  
  'Edge Cases': [
    { input: '', expected: '', description: 'Empty string' },
    { input: null, expected: '', description: 'Null input' },
    { input: undefined, expected: '', description: 'Undefined input' },
    { input: 'abc', expected: 'abc', description: 'Non-numeric string' },
    { input: '123', expected: '123', description: 'Too short' },
    { input: '01234567890123456789', expected: '01234567890123456789', description: 'Too long' },
    { input: '++33612345678', expected: '++33612345678', description: 'Double plus' },
    { input: '01.23.45.67.89', expected: '+33 1 23 45 67 89', description: 'With dots' },
    { input: '01-23-45-67-89', expected: '+33 1 23 45 67 89', description: 'With dashes' },
    { input: '01 23 45 67 89', expected: '+33 1 23 45 67 89', description: 'With spaces' }
  ],
  
  'Performance Test Cases': [
    { input: '0612345678', expected: '+33 6 12 34 56 78', description: 'Standard format' },
    { input: '+033612345678', expected: '+33 6 12 34 56 78', description: 'Malformed +033' },
    { input: '06123456789', expected: '+33 6 12 34 56 78', description: 'Extra digit' },
    { input: '+0612345678', expected: '+33 6 12 34 56 78', description: 'Malformed +0' },
    { input: '061234567', expected: '+33 6 12 34 56 7', description: 'Truncated' },
    { input: '06 12 34 56 78', expected: '+33 6 12 34 56 78', description: 'With spaces' }
  ]
};

// Command line argument parsing
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const benchmark = args.includes('--benchmark');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
📞 Comprehensive Phone Number Formatting Validation

Usage: node scripts/comprehensive-phone-validation.cjs [options]

Options:
  --verbose    Show detailed test results
  --benchmark  Run performance benchmarks
  --help, -h   Show this help message

This script validates the enhanced formatPhoneNumber function against
all identified problematic formats and provides detailed reporting.
`);
  process.exit(0);
}

// Main validation function
function runValidation() {
  console.log('📞 Comprehensive Phone Number Formatting Validation\n');
  console.log('=' .repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  const results = {};
  const failedTests = [];
  
  // Run test suites
  Object.keys(testSuites).forEach(suiteName => {
    console.log(`\n🧪 ${suiteName}`);
    console.log('-'.repeat(40));
    
    const suite = testSuites[suiteName];
    let suitePassed = 0;
    let suiteFailed = 0;
    
    suite.forEach((testCase, index) => {
      try {
        const result = formatPhoneNumber(testCase.input);
        const success = result === testCase.expected;
        
        if (success) {
          suitePassed++;
          totalPassed++;
          if (verbose) {
            console.log(`  ✅ ${testCase.description}: '${testCase.input}' → '${result}'`);
          }
        } else {
          suiteFailed++;
          totalFailed++;
          const failedTest = {
            suite: suiteName,
            description: testCase.description,
            input: testCase.input,
            expected: testCase.expected,
            actual: result
          };
          failedTests.push(failedTest);
          
          if (verbose) {
            console.log(`  ❌ ${testCase.description}: '${testCase.input}' → '${result}' (expected: '${testCase.expected}')`);
          }
        }
      } catch (error) {
        suiteFailed++;
        totalFailed++;
        const failedTest = {
          suite: suiteName,
          description: testCase.description,
          input: testCase.input,
          expected: testCase.expected,
          actual: `ERROR: ${error.message}`
        };
        failedTests.push(failedTest);
        
        if (verbose) {
          console.log(`  💥 ${testCase.description}: '${testCase.input}' → ERROR: ${error.message}`);
        }
      }
    });
    
    console.log(`  Results: ${suitePassed}/${suite.length} passed`);
    results[suiteName] = { passed: suitePassed, failed: suiteFailed, total: suite.length };
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  Object.keys(results).forEach(suiteName => {
    const result = results[suiteName];
    const percentage = ((result.passed / result.total) * 100).toFixed(1);
    console.log(`  ${suiteName}: ${result.passed}/${result.total} (${percentage}%)`);
  });
  
  const totalTests = totalPassed + totalFailed;
  const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
  
  // Failed tests details
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.suite} - ${test.description}`);
      console.log(`     Input: '${test.input}'`);
      console.log(`     Expected: '${test.expected}'`);
      console.log(`     Actual: '${test.actual}'`);
      console.log('');
    });
  }
  
  return { totalPassed, totalFailed, failedTests };
}

// Performance benchmark
function runBenchmark() {
  console.log('\n⚡ PERFORMANCE BENCHMARK');
  console.log('='.repeat(60));
  
  const perfTestCases = testSuites['Performance Test Cases'];
  const iterations = [100, 1000, 10000];
  
  iterations.forEach(iterCount => {
    console.log(`\n📈 Testing ${iterCount} iterations per format:`);
    
    perfTestCases.forEach(testCase => {
      const startTime = performance.now();
      
      for (let i = 0; i < iterCount; i++) {
        formatPhoneNumber(testCase.input);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterCount;
      
      console.log(`  ${testCase.description.padEnd(20)}: ${avgTime.toFixed(4)}ms avg (${totalTime.toFixed(2)}ms total)`);
    });
  });
  
  // Large dataset test
  console.log(`\n📊 Large Dataset Test (10,000 mixed formats):`);
  const largeDataset = [];
  for (let i = 0; i < 10000; i++) {
    const testCase = perfTestCases[i % perfTestCases.length];
    largeDataset.push(testCase.input);
  }
  
  const startTime = performance.now();
  largeDataset.forEach(phone => formatPhoneNumber(phone));
  const endTime = performance.now();
  
  const totalTime = endTime - startTime;
  const avgTime = totalTime / largeDataset.length;
  
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Average per call: ${avgTime.toFixed(4)}ms`);
  console.log(`  Performance target (<1ms): ${avgTime < 1 ? '✅ PASSED' : '❌ FAILED'}`);
}

// Generate report
function generateReport(results) {
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.totalPassed + results.totalFailed,
      passed: results.totalPassed,
      failed: results.totalFailed,
      successRate: ((results.totalPassed / (results.totalPassed + results.totalFailed)) * 100).toFixed(1) + '%'
    },
    failedTests: results.failedTests,
    supportedFormats: [
      'Standard 10-digit numbers (0XXXXXXXXX)',
      'Already formatted +33 numbers',
      '+33(0) format',
      '9-digit mobile/landline numbers',
      'Numbers with spaces, dots, dashes',
      'Truncated numbers (9 digits starting with 0)',
      'Numbers with 00 prefix (0069540063)',
      'Malformed +033 prefix',
      'Numbers with extra digits',
      'Malformed +0 prefix',
      'Numbers without + before 33'
    ]
  };
  
  const reportPath = path.join(__dirname, '..', 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Main execution
function main() {
  const results = runValidation();
  
  if (benchmark) {
    runBenchmark();
  }
  
  generateReport(results);
  
  if (results.totalFailed === 0) {
    console.log('\n🎉 All tests passed! Phone number formatting is working correctly.');
    process.exit(0);
  } else {
    console.log(`\n❌ ${results.totalFailed} test(s) failed. Please review the issues above.`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { formatPhoneNumber, testSuites, runValidation, runBenchmark };