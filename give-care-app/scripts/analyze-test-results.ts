#!/usr/bin/env tsx
/**
 * Automated E2E Test Analysis
 *
 * Analyzes test results, categorizes failures, and creates GitHub issues
 * Run after test suite: npm run analyze-tests
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

interface TestFailure {
  scenario: string;
  step: string;
  error: string;
  category: 'critical' | 'high' | 'medium' | 'low' | 'expected';
  rootCause?: string;
  suggestedFix?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
}

interface TestResult {
  scenario: string;
  success: boolean;
  duration: number;
  failures: string[];
}

interface AnalysisReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  failures: TestFailure[];
  summary: string;
  recommendations: string[];
}

/**
 * Parse test results from log file
 */
function parseTestResults(logPath: string): TestResult[] {
  if (!existsSync(logPath)) {
    console.error(`Test log not found: ${logPath}`);
    process.exit(1);
  }

  const logContent = readFileSync(logPath, 'utf-8');
  const results: TestResult[] = [];

  // Parse test output (assuming format from runner.ts)
  const scenarioBlocks = logContent.split('▶ Running:').slice(1);

  for (const block of scenarioBlocks) {
    const lines = block.split('\n');
    const scenario = lines[0]?.trim() || 'Unknown';

    const failures: string[] = [];
    let success = true;

    for (const line of lines) {
      if (line.includes('✗ Step')) {
        success = false;
        failures.push(line.trim());
      }
    }

    // Extract duration (rough estimate from timestamps)
    const duration = 1000; // Placeholder

    results.push({ scenario, success, duration, failures });
  }

  return results;
}

/**
 * Categorize failures by severity and root cause
 */
function categorizeFailures(results: TestResult[]): TestFailure[] {
  const failures: TestFailure[] = [];

  for (const result of results) {
    if (!result.success) {
      for (const failure of result.failures) {
        const testFailure = categorizeFailure(result.scenario, failure);
        failures.push(testFailure);
      }
    }
  }

  return failures;
}

/**
 * Categorize a single failure
 */
function categorizeFailure(scenario: string, errorLine: string): TestFailure {
  const failure: TestFailure = {
    scenario,
    step: extractStepNumber(errorLine),
    error: errorLine,
    category: 'medium',
  };

  // Pattern matching for known issues
  if (errorLine.includes('workflow') || errorLine.includes('Invalid arguments for workflow')) {
    failure.category = 'critical';
    failure.priority = 'P0';
    failure.rootCause = 'Workflow invocation pattern mismatch';
    failure.suggestedFix = 'Use workflow.start() instead of scheduler.runAfter()';
  } else if (errorLine.includes('Agent API unavailable') || errorLine.includes('Cannot connect to API')) {
    failure.category = 'expected';
    failure.rootCause = 'Missing LLM API keys (expected in test environment)';
    failure.suggestedFix = 'Add OPENAI_API_KEY and GOOGLE_GENERATIVE_AI_API_KEY to environment';
  } else if (errorLine.includes('No completed assessment') || errorLine.includes('Assessment not finalized')) {
    failure.category = 'critical';
    failure.priority = 'P0';
    failure.rootCause = 'Assessment finalization workflow not triggered';
    failure.suggestedFix = 'Fix workflow invocation + add auto-finalization trigger';
  } else if (errorLine.includes('timeout') || errorLine.includes('Scenario timeout')) {
    failure.category = 'high';
    failure.priority = 'P1';
    failure.rootCause = 'Test timeout (18s retry delays)';
    failure.suggestedFix = 'Reduce timeout in test environment (18s → 2s)';
  } else if (errorLine.includes('Validator error') || errorLine.includes('Expected ID for table')) {
    failure.category = 'low';
    failure.priority = 'P2';
    failure.rootCause = 'Invalid test ID format';
    failure.suggestedFix = 'Use properly formatted Convex ID in test';
  } else if (errorLine.includes('User not found')) {
    failure.category = 'low';
    failure.priority = 'P2';
    failure.rootCause = 'Test setup issue (user not created)';
    failure.suggestedFix = 'Verify test setup creates user before operations';
  }

  return failure;
}

/**
 * Extract step number from error line
 */
function extractStepNumber(errorLine: string): string {
  const match = errorLine.match(/Step (\d+)/);
  return match ? `Step ${match[1]}` : 'Unknown step';
}

/**
 * Create GitHub issue for failure
 */
async function createGitHubIssue(failure: TestFailure): Promise<void> {
  if (failure.category === 'expected') {
    // Don't create issues for expected failures
    return;
  }

  const title = `[E2E] ${failure.scenario} - ${failure.step}`;
  const body = `## Test Failure

**Scenario**: ${failure.scenario}
**Step**: ${failure.step}
**Category**: ${failure.category}
**Priority**: ${failure.priority || 'P2'}

### Error
\`\`\`
${failure.error}
\`\`\`

### Root Cause
${failure.rootCause || 'To be investigated'}

### Suggested Fix
${failure.suggestedFix || 'To be determined'}

### Automation
This issue was automatically created by the E2E test analysis tool.

---
**Auto-generated** on ${new Date().toISOString()}`;

  const labels = [
    'e2e-test',
    failure.priority || 'P2',
    failure.category === 'critical' ? 'bug' : 'enhancement',
  ];

  try {
    // Use GitHub CLI to create issue
    const labelArgs = labels.map(l => `--label "${l}"`).join(' ');
    const command = `gh issue create --title "${title}" --body "${body.replace(/"/g, '\\"')}" ${labelArgs}`;

    execSync(command, { stdio: 'inherit' });
    console.log(`✓ Created issue: ${title}`);
  } catch (error) {
    console.error(`✗ Failed to create issue: ${error}`);
  }
}

/**
 * Generate analysis report
 */
function generateReport(results: TestResult[], failures: TestFailure[]): AnalysisReport {
  const totalTests = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = totalTests - passed;
  const passRate = (passed / totalTests) * 100;

  // Count by category
  const critical = failures.filter(f => f.category === 'critical').length;
  const high = failures.filter(f => f.category === 'high').length;
  const expected = failures.filter(f => f.category === 'expected').length;

  const summary = `
E2E Test Analysis Summary
========================

Total Tests: ${totalTests}
Passed: ${passed} (${passRate.toFixed(1)}%)
Failed: ${failed}

Failures by Category:
- Critical (P0): ${critical}
- High (P1): ${high}
- Expected: ${expected}

${critical > 0 ? '⚠️  CRITICAL ISSUES FOUND - Immediate action required' : ''}
${expected > 0 ? `ℹ️  ${expected} expected failures (missing API keys)` : ''}
`;

  const recommendations: string[] = [];

  if (critical > 0) {
    recommendations.push('Fix critical workflow invocation bugs before deploying to production');
  }
  if (high > 0) {
    recommendations.push('Reduce test timeouts to improve test execution speed');
  }
  if (expected > 0) {
    recommendations.push('Add API keys to CI/CD environment for full test coverage');
  }
  if (passRate < 90) {
    recommendations.push('Pass rate below 90% - prioritize test fixes in next sprint');
  }

  return {
    timestamp: new Date().toISOString(),
    totalTests,
    passed,
    failed,
    passRate,
    failures,
    summary,
    recommendations,
  };
}

/**
 * Save report to file
 */
function saveReport(report: AnalysisReport, outputPath: string): void {
  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✓ Report saved to: ${outputPath}`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const logPath = args[0] || 'test-results/e2e-output.log';
  const outputPath = args[1] || 'test-results/analysis-report.json';
  const createIssues = args.includes('--create-issues');

  console.log('E2E Test Analysis Tool\n');

  // Parse test results
  console.log(`Reading test results from: ${logPath}`);
  const results = parseTestResults(logPath);

  // Categorize failures
  console.log('Categorizing failures...');
  const failures = categorizeFailures(results);

  // Generate report
  console.log('Generating analysis report...');
  const report = generateReport(results, failures);

  // Print summary
  console.log(report.summary);

  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  // Save report
  saveReport(report, outputPath);

  // Create GitHub issues (optional)
  if (createIssues) {
    console.log('\nCreating GitHub issues for failures...\n');
    for (const failure of failures) {
      await createGitHubIssue(failure);
    }
  } else {
    console.log('\nSkipping GitHub issue creation (use --create-issues to enable)');
  }

  // Exit with error if critical failures found
  const criticalCount = failures.filter(f => f.category === 'critical').length;
  if (criticalCount > 0) {
    console.error(`\n❌ ${criticalCount} critical failure(s) found`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}
