/**
 * Visual Regression Test Script for Shadcn Table Migration
 * 
 * This script validates that the VirtualizedContactTable component
 * has been successfully migrated to Shadcn UI styling standards.
 * 
 * Run with: node scripts/test-table-ui.cjs
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

/**
 * Log test result
 */
function logTest(name, passed, message = '') {
  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} ${name}`);
  if (message) {
    console.log(`    ${colors.cyan}${message}${colors.reset}`);
  }
  
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

/**
 * Log warning
 */
function logWarning(message) {
  console.log(`  ${colors.yellow}⚠ WARNING${colors.reset} ${message}`);
  results.warnings++;
}

/**
 * Read file content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Test 1: Verify SHADCN_STYLES constant exists
 */
function testShadcnStylesConstant() {
  console.log(`\n${colors.blue}Test 1: SHADCN_STYLES Constant${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false, 'Could not read VirtualizedContactTable.tsx');
    return;
  }
  
  const hasShadcnStyles = content.includes('const SHADCN_STYLES = {');
  logTest('SHADCN_STYLES constant defined', hasShadcnStyles);
  
  if (hasShadcnStyles) {
    const hasTableContainer = content.includes('tableContainer:');
    const hasTableHeader = content.includes('tableHeader:');
    const hasHeaderCell = content.includes('headerCell:');
    const hasBodyRow = content.includes('bodyRow:');
    const hasBodyCell = content.includes('bodyCell:');
    
    logTest('tableContainer style defined', hasTableContainer);
    logTest('tableHeader style defined', hasTableHeader);
    logTest('headerCell style defined', hasHeaderCell);
    logTest('bodyRow style defined', hasBodyRow);
    logTest('bodyCell style defined', hasBodyCell);
  }
}

/**
 * Test 2: Verify no boxShadow inline styles
 */
function testNoBoxShadow() {
  console.log(`\n${colors.blue}Test 2: No boxShadow Inline Styles${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasBoxShadow = content.includes('boxShadow:') || content.includes('box-shadow:');
  logTest('No boxShadow properties', !hasBoxShadow, 
    hasBoxShadow ? 'Found boxShadow in file' : 'All boxShadow removed');
}

/**
 * Test 3: Verify no vertical borders (border-r)
 */
function testNoVerticalBorders() {
  console.log(`\n${colors.blue}Test 3: No Vertical Borders${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  // Check for border-r in className strings
  const hasBorderR = /className.*border-r/.test(content);
  logTest('No border-r classes', !hasBorderR,
    hasBorderR ? 'Found border-r classes' : 'All vertical borders removed');
}

/**
 * Test 4: Verify header height is h-10
 */
function testHeaderHeight() {
  console.log(`\n${colors.blue}Test 4: Header Height (h-10)${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  // Check for h-10 in headerCell style
  const hasH10 = content.includes('h-10') && content.includes('headerCell');
  logTest('Header uses h-10 class', hasH10);
  
  // Check that h-16 is not used for headers
  const hasH16 = /h-16.*header/i.test(content);
  logTest('No h-16 for headers', !hasH16);
}

/**
 * Test 5: Verify SHADCN_SPACING constant
 */
function testShadcnSpacing() {
  console.log(`\n${colors.blue}Test 5: SHADCN_SPACING Configuration${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasSpacing = content.includes('const SHADCN_SPACING = {');
  logTest('SHADCN_SPACING constant defined', hasSpacing);
  
  if (hasSpacing) {
    const hasHeaderHeight = content.includes('headerHeight: 40');
    const hasRowHeight = content.includes('rowHeight: 36');
    
    logTest('headerHeight set to 40px', hasHeaderHeight);
    logTest('rowHeight set to 36px', hasRowHeight);
  }
}

/**
 * Test 6: Verify COLUMN_RESIZE_CONFIG
 */
function testColumnResizeConfig() {
  console.log(`\n${colors.blue}Test 6: Column Resize Configuration${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasConfig = content.includes('const COLUMN_RESIZE_CONFIG = {');
  logTest('COLUMN_RESIZE_CONFIG constant defined', hasConfig);
  
  if (hasConfig) {
    const hasFixed = content.includes('fixed: {');
    const hasFlexible = content.includes('flexible: {');
    
    logTest('Fixed columns configuration exists', hasFixed);
    logTest('Flexible columns configuration exists', hasFlexible);
  }
}

/**
 * Test 7: Verify responsive hooks
 */
function testResponsiveHooks() {
  console.log(`\n${colors.blue}Test 7: Responsive Breakpoint System${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasUseResponsive = content.includes('const useResponsiveColumns');
  const hasMobileConfig = content.includes('const MOBILE_COLUMN_CONFIG');
  const hasGetVisible = content.includes('const getVisibleColumnsForScreenSize');
  
  logTest('useResponsiveColumns hook defined', hasUseResponsive);
  logTest('MOBILE_COLUMN_CONFIG defined', hasMobileConfig);
  logTest('getVisibleColumnsForScreenSize function defined', hasGetVisible);
}

/**
 * Test 8: Verify Shadcn classes applied
 */
function testShadcnClassesApplied() {
  console.log(`\n${colors.blue}Test 8: Shadcn Classes Applied${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasTextMutedForeground = content.includes('text-muted-foreground');
  const hasBgAccent = content.includes('bg-accent');
  const hasHoverBgMuted = content.includes('hover:bg-muted');
  const hasPx3 = content.includes('px-3');
  
  logTest('text-muted-foreground used', hasTextMutedForeground);
  logTest('bg-accent used for selection', hasBgAccent);
  logTest('hover:bg-muted used', hasHoverBgMuted);
  logTest('px-3 spacing used', hasPx3);
}

/**
 * Test 9: Verify virtualization updated
 */
function testVirtualizationUpdated() {
  console.log(`\n${colors.blue}Test 9: Virtualization Configuration${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const usesSpacingRowHeight = content.includes('estimateSize: () => SHADCN_SPACING.rowHeight');
  const hasGetOverscan = content.includes('const getOverscan');
  
  logTest('Uses SHADCN_SPACING.rowHeight', usesSpacingRowHeight);
  logTest('Dynamic overscan implemented', hasGetOverscan);
}

/**
 * Test 10: Verify calculateResponsiveWidths
 */
function testCalculateResponsiveWidths() {
  console.log(`\n${colors.blue}Test 10: Responsive Width Calculation${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasCalculate = content.includes('const calculateResponsiveWidths');
  const hasErrorHandling = content.includes('try {') && content.includes('catch (error)');
  const hasValidation = content.includes('validatedWidth');
  
  logTest('calculateResponsiveWidths function exists', hasCalculate);
  logTest('Error handling implemented', hasErrorHandling);
  logTest('Width validation implemented', hasValidation);
}

/**
 * Test 11: Verify INPUT_BASE_CLASS updated
 */
function testInputBaseClass() {
  console.log(`\n${colors.blue}Test 11: Input Base Class${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasUpdatedInput = content.includes('const INPUT_BASE_CLASS = "h-8 px-3 py-1 text-sm');
  const hasBgTransparent = content.includes('bg-transparent');
  const hasFocusAccent = content.includes('focus:bg-accent');
  
  logTest('INPUT_BASE_CLASS updated', hasUpdatedInput);
  logTest('Uses bg-transparent', hasBgTransparent);
  logTest('Uses focus:bg-accent', hasFocusAccent);
}

/**
 * Test 12: Verify no legacy backdrop filters
 */
function testNoLegacyBackdrop() {
  console.log(`\n${colors.blue}Test 12: No Legacy Backdrop Filters${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasWebkitBackdrop = content.includes('WebkitBackdropFilter');
  const hasWillChange = content.includes('willChange:');
  const hasTranslateZ = content.includes('translateZ');
  
  logTest('No WebkitBackdropFilter', !hasWebkitBackdrop);
  logTest('No willChange property', !hasWillChange);
  logTest('No translateZ transform', !hasTranslateZ);
}

/**
 * Run all tests
 */
function runTests() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Shadcn Table Migration - Visual Regression Tests${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  
  testShadcnStylesConstant();
  testNoBoxShadow();
  testNoVerticalBorders();
  testHeaderHeight();
  testShadcnSpacing();
  testColumnResizeConfig();
  testResponsiveHooks();
  testShadcnClassesApplied();
  testVirtualizationUpdated();
  testCalculateResponsiveWidths();
  testInputBaseClass();
  testNoLegacyBackdrop();
  
  // Print summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Test Summary${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.green}Passed:${colors.reset}   ${results.passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset}   ${results.failed}`);
  console.log(`  ${colors.yellow}Warnings:${colors.reset} ${results.warnings}`);
  console.log(`  Total:    ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
    console.log(`${colors.green}  The Shadcn table migration is complete.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed.${colors.reset}`);
    console.log(`${colors.red}  Please review the failed tests above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests();
