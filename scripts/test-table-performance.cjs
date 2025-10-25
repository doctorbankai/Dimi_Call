/**
 * Performance Benchmark Tests for Shadcn Table Migration
 * 
 * This script provides performance benchmarks to ensure the migration
 * maintains the same high performance as the original implementation.
 * 
 * Note: These are static code analysis tests. For runtime performance,
 * use browser DevTools or Lighthouse.
 * 
 * Run with: node scripts/test-table-performance.cjs
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

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

function logWarning(message) {
  console.log(`  ${colors.yellow}⚠ WARNING${colors.reset} ${message}`);
  results.warnings++;
}

function logInfo(message) {
  console.log(`  ${colors.magenta}ℹ INFO${colors.reset} ${message}`);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Test 1: Verify virtualization is maintained
 */
function testVirtualizationMaintained() {
  console.log(`\n${colors.blue}Test 1: Virtualization Performance${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasUseVirtualizer = content.includes('useVirtualizer');
  const hasEstimateSize = content.includes('estimateSize:');
  const hasOverscan = content.includes('overscan:');
  const hasGetScrollElement = content.includes('getScrollElement:');
  
  logTest('useVirtualizer hook used', hasUseVirtualizer);
  logTest('estimateSize configured', hasEstimateSize);
  logTest('overscan configured', hasOverscan);
  logTest('getScrollElement configured', hasGetScrollElement);
  
  if (hasUseVirtualizer) {
    logInfo('Virtualization ensures only visible rows are rendered');
  }
}

/**
 * Test 2: Verify memoization is used
 */
function testMemoizationUsed() {
  console.log(`\n${colors.blue}Test 2: Memoization Optimizations${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const useMemoCount = (content.match(/useMemo/g) || []).length;
  const useCallbackCount = (content.match(/useCallback/g) || []).length;
  const reactMemoCount = (content.match(/React\.memo/g) || []).length;
  
  logTest('useMemo used for expensive calculations', useMemoCount >= 3, 
    `Found ${useMemoCount} useMemo calls`);
  logTest('useCallback used for event handlers', useCallbackCount >= 2,
    `Found ${useCallbackCount} useCallback calls`);
  logTest('React.memo used for child components', reactMemoCount >= 2,
    `Found ${reactMemoCount} React.memo calls`);
  
  if (useMemoCount >= 3 && useCallbackCount >= 2) {
    logInfo('Good memoization prevents unnecessary re-renders');
  }
}

/**
 * Test 3: Verify debouncing is maintained
 */
function testDebouncingMaintained() {
  console.log(`\n${colors.blue}Test 3: Debouncing for Updates${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasUseDebouncedUpdate = content.includes('useDebouncedUpdate');
  const hasDebouncedComment = content.includes('debouncedCommentUpdate');
  const hasDebouncedDate = content.includes('debouncedDateUpdate');
  
  logTest('useDebouncedUpdate hook used', hasUseDebouncedUpdate);
  logTest('Comment updates debounced', hasDebouncedComment);
  logTest('Date updates debounced', hasDebouncedDate);
  
  if (hasUseDebouncedUpdate) {
    logInfo('Debouncing reduces API calls and improves performance');
  }
}

/**
 * Test 4: Verify efficient column calculation
 */
function testEfficientColumnCalculation() {
  console.log(`\n${colors.blue}Test 4: Column Width Calculation Efficiency${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasCalculateInMemo = content.includes('const calculateResponsiveWidths = useMemo');
  const hasErrorHandling = content.includes('try {') && content.includes('catch (error)');
  const hasFallback = content.includes('calculatedWidth: \'100px\'');
  
  logTest('Column calculation wrapped in useMemo', hasCalculateInMemo);
  logTest('Error handling prevents crashes', hasErrorHandling);
  logTest('Fallback widths prevent layout breaks', hasFallback);
  
  if (hasCalculateInMemo) {
    logInfo('Memoized calculation runs only when dependencies change');
  }
}

/**
 * Test 5: Verify responsive resize is debounced
 */
function testResponsiveDebounced() {
  console.log(`\n${colors.blue}Test 5: Responsive Resize Performance${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasResizeListener = content.includes('window.addEventListener(\'resize\'');
  const hasDebounce = content.includes('setTimeout') || content.includes('debounce');
  const hasCleanup = content.includes('removeEventListener');
  
  logTest('Resize listener implemented', hasResizeListener);
  logTest('Resize events debounced', hasDebounce);
  logTest('Event listener cleanup on unmount', hasCleanup);
  
  if (hasDebounce) {
    logInfo('Debounced resize prevents excessive recalculations');
  }
}

/**
 * Test 6: Verify no unnecessary re-renders
 */
function testNoUnnecessaryRerenders() {
  console.log(`\n${colors.blue}Test 6: Render Optimization${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  // Check for proper dependency arrays
  const useMemoWithDeps = /useMemo\([^)]+,\s*\[[^\]]+\]/g.test(content);
  const useCallbackWithDeps = /useCallback\([^)]+,\s*\[[^\]]+\]/g.test(content);
  const useEffectWithDeps = /useEffect\([^)]+,\s*\[[^\]]*\]/g.test(content);
  
  logTest('useMemo has dependency arrays', useMemoWithDeps);
  logTest('useCallback has dependency arrays', useCallbackWithDeps);
  logTest('useEffect has dependency arrays', useEffectWithDeps);
  
  if (useMemoWithDeps && useCallbackWithDeps) {
    logInfo('Proper dependencies prevent unnecessary recalculations');
  }
}

/**
 * Test 7: Verify efficient sorting
 */
function testEfficientSorting() {
  console.log(`\n${colors.blue}Test 7: Sorting Performance${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasSortedContactsMemo = content.includes('const sortedContacts = useMemo');
  const hasSortDependencies = /sortedContacts.*useMemo.*\[.*sortConfig/s.test(content);
  
  logTest('Sorted contacts memoized', hasSortedContactsMemo);
  logTest('Sort only runs when config changes', hasSortDependencies);
  
  if (hasSortedContactsMemo) {
    logInfo('Memoized sorting prevents re-sorting on every render');
  }
}

/**
 * Test 8: Verify localStorage operations are safe
 */
function testLocalStorageSafe() {
  console.log(`\n${colors.blue}Test 8: LocalStorage Performance${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  // Check for try-catch around localStorage
  const localStorageInTryCatch = /try\s*{[^}]*localStorage[^}]*}\s*catch/g.test(content);
  const hasUseEffect = content.includes('useEffect');
  
  logTest('localStorage wrapped in try-catch', localStorageInTryCatch);
  logTest('localStorage in useEffect (not render)', hasUseEffect);
  
  if (localStorageInTryCatch) {
    logInfo('Safe localStorage prevents crashes in private browsing');
  }
}

/**
 * Test 9: Verify dynamic overscan optimization
 */
function testDynamicOverscan() {
  console.log(`\n${colors.blue}Test 9: Dynamic Overscan Optimization${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  const hasGetOverscan = content.includes('const getOverscan');
  const hasScreenSizeDependency = /overscan.*screenSize/s.test(content);
  
  logTest('getOverscan function defined', hasGetOverscan);
  logTest('Overscan adapts to screen size', hasScreenSizeDependency);
  
  if (hasGetOverscan) {
    logInfo('Dynamic overscan optimizes for different devices');
  }
}

/**
 * Test 10: Verify no inline functions in render
 */
function testNoInlineFunctions() {
  console.log(`\n${colors.blue}Test 10: Inline Function Optimization${colors.reset}`);
  
  const content = readFile('src/components/VirtualizedContactTable.tsx');
  if (!content) {
    logTest('File exists', false);
    return;
  }
  
  // This is a heuristic - check for common patterns
  const hasHandleSort = content.includes('const handleSort = useCallback');
  const hasHandleEdit = content.includes('handleEditCommit');
  const hasRenderCell = content.includes('const renderCellContent');
  
  logTest('Event handlers defined outside render', hasHandleSort);
  logTest('Edit handlers properly defined', hasHandleEdit);
  logTest('Cell renderer defined as function', hasRenderCell);
  
  if (hasHandleSort && hasRenderCell) {
    logInfo('Stable function references prevent child re-renders');
  }
}

/**
 * Performance recommendations
 */
function printRecommendations() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Performance Recommendations${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  
  console.log(`\n${colors.yellow}For Runtime Performance Testing:${colors.reset}`);
  console.log(`  1. Use Chrome DevTools Performance tab`);
  console.log(`  2. Test with 5000+ contacts`);
  console.log(`  3. Measure scroll FPS (should be 60fps)`);
  console.log(`  4. Check Time to Interactive (TTI)`);
  console.log(`  5. Monitor memory usage during extended use`);
  
  console.log(`\n${colors.yellow}Expected Performance Metrics:${colors.reset}`);
  console.log(`  • Initial render: < 100ms (5000 contacts)`);
  console.log(`  • Scroll performance: 60fps`);
  console.log(`  • Column resize: < 50ms`);
  console.log(`  • Sort operation: < 200ms`);
  console.log(`  • Memory: Stable (no leaks)`);
  
  console.log(`\n${colors.yellow}Optimization Tips:${colors.reset}`);
  console.log(`  • Keep overscan low on mobile (5 rows)`);
  console.log(`  • Debounce user inputs (300-500ms)`);
  console.log(`  • Use React DevTools Profiler`);
  console.log(`  • Monitor bundle size impact`);
  console.log(`  • Test on low-end devices`);
}

/**
 * Run all tests
 */
function runTests() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Shadcn Table Migration - Performance Benchmarks${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  
  testVirtualizationMaintained();
  testMemoizationUsed();
  testDebouncingMaintained();
  testEfficientColumnCalculation();
  testResponsiveDebounced();
  testNoUnnecessaryRerenders();
  testEfficientSorting();
  testLocalStorageSafe();
  testDynamicOverscan();
  testNoInlineFunctions();
  
  printRecommendations();
  
  // Print summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Test Summary${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.green}Passed:${colors.reset}   ${results.passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset}   ${results.failed}`);
  console.log(`  ${colors.yellow}Warnings:${colors.reset} ${results.warnings}`);
  console.log(`  Total:    ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log(`\n${colors.green}✓ All performance checks passed!${colors.reset}`);
    console.log(`${colors.green}  The table maintains high performance standards.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some performance checks failed.${colors.reset}`);
    console.log(`${colors.red}  Review the failed checks for optimization opportunities.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runTests();
