#!/usr/bin/env tsx

/**
 * ClaimSight Challenge Test Runner
 *
 * Runs challenge tests and displays progress in a user-friendly format
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// Challenge definitions
interface Challenge {
  id: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  name: string;
  testFile: string;
  optional?: boolean;
}

const CHALLENGES: Challenge[] = [
  // Beginner
  { id: '1', level: 'beginner', name: 'GraphQL Query Explorer', testFile: 'beginner/challenge-1.test.ts' },
  { id: '2', level: 'beginner', name: 'Understanding Relationships', testFile: 'beginner/challenge-2.test.ts' },
  { id: '3', level: 'beginner', name: 'Mutations and Inserts', testFile: 'beginner/challenge-3.test.ts' },

  // Intermediate
  { id: '4', level: 'intermediate', name: 'Row-Level Security', testFile: 'intermediate/challenge-4.test.ts' },
  { id: '5', level: 'intermediate', name: 'Custom Hasura Actions', testFile: 'intermediate/challenge-5.test.ts', optional: true },
  { id: '6', level: 'intermediate', name: 'Apollo Client Optimistic Updates', testFile: 'intermediate/challenge-6.test.ts', optional: true },
  { id: '6A', level: 'intermediate', name: 'Delete Note Functionality', testFile: 'intermediate/challenge-6a.test.ts', optional: true },
  { id: '6B', level: 'intermediate', name: 'Update/Edit Note Functionality', testFile: 'intermediate/challenge-6b.test.ts', optional: true },
  { id: '6C', level: 'intermediate', name: 'Note Filtering and Search', testFile: 'intermediate/challenge-6c.test.ts', optional: true },
  { id: '6D', level: 'intermediate', name: 'Note Pagination', testFile: 'intermediate/challenge-6d.test.ts', optional: true },
];

const LEVEL_EMOJI = {
  beginner: '🟢',
  intermediate: '🟡',
  advanced: '🔴',
  expert: '🟣',
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log('\n');
  console.log(colorize('╔══════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║          ClaimSight Challenge Test Runner               ║', 'cyan'));
  console.log(colorize('╚══════════════════════════════════════════════════════════╝', 'cyan'));
  console.log('\n');
}

function printUsage() {
  console.log(colorize('Usage:', 'bright'));
  console.log('  npm run test:progress              Run all challenge tests');
  console.log('  npm run test:challenge 1           Run specific challenge');
  console.log('  npm run test:challenges            Run tests with Vitest');
  console.log('\n');
}

function checkEnvironment(): boolean {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    console.log(colorize('❌ Error: .env file not found', 'red'));
    console.log(colorize('Please run: cp .env.example .env', 'yellow'));
    return false;
  }

  const env = readFileSync(envPath, 'utf-8');

  if (!env.includes('HASURA_GRAPHQL_ENDPOINT')) {
    console.log(colorize('❌ Error: HASURA_GRAPHQL_ENDPOINT not set in .env', 'red'));
    return false;
  }

  if (!env.includes('HASURA_GRAPHQL_ADMIN_SECRET')) {
    console.log(colorize('❌ Error: HASURA_GRAPHQL_ADMIN_SECRET not set in .env', 'red'));
    return false;
  }

  return true;
}

function runTest(challenge: Challenge): { passed: boolean; skipped: boolean; output: string } {
  const testPath = resolve(process.cwd(), 'tests', challenge.testFile);

  if (!existsSync(testPath)) {
    return { passed: false, skipped: true, output: 'Test file not found' };
  }

  try {
    const output = execSync(`npx vitest run ${testPath} --config tests/vitest.config.ts --reporter=verbose`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    return { passed: true, skipped: false, output };
  } catch (error: any) {
    return { passed: false, skipped: false, output: error.stdout || error.message };
  }
}

function printProgress(results: Map<string, boolean>) {
  console.log('\n');
  console.log(colorize('═══════════════════════════════════════════', 'cyan'));
  console.log(colorize('  Challenge Progress', 'bright'));
  console.log(colorize('═══════════════════════════════════════════', 'cyan'));
  console.log('\n');

  const groupedChallenges = CHALLENGES.reduce((acc, challenge) => {
    if (!acc[challenge.level]) {
      acc[challenge.level] = [];
    }
    acc[challenge.level].push(challenge);
    return acc;
  }, {} as Record<string, Challenge[]>);

  Object.entries(groupedChallenges).forEach(([level, challenges]) => {
    const emoji = LEVEL_EMOJI[level as keyof typeof LEVEL_EMOJI];
    console.log(colorize(`${emoji} ${level.toUpperCase()}`, 'bright'));
    console.log('');

    challenges.forEach(challenge => {
      const result = results.get(challenge.id);
      let status = '⏸️';
      let statusColor: keyof typeof colors = 'gray';

      if (result === true) {
        status = '✅';
        statusColor = 'green';
      } else if (result === false) {
        status = '❌';
        statusColor = 'red';
      }

      const optional = challenge.optional ? colorize(' (optional)', 'dim') : '';
      console.log(`  ${colorize(status, statusColor)}  Challenge ${challenge.id}: ${challenge.name}${optional}`);
    });

    console.log('');
  });

  // Summary
  const total = CHALLENGES.filter(c => !c.optional).length;
  const completed = Array.from(results.values()).filter(v => v === true).length;
  const percentage = Math.round((completed / total) * 100);

  console.log(colorize('═══════════════════════════════════════════', 'cyan'));
  console.log(colorize(`  Completed: ${completed}/${total} (${percentage}%)`, 'bright'));
  console.log(colorize('═══════════════════════════════════════════', 'cyan'));
  console.log('\n');

  if (completed === total) {
    console.log(colorize('🎉 Congratulations! You\'ve completed all required challenges!', 'green'));
    console.log(colorize('   Ready to tackle the optional challenges?', 'cyan'));
    console.log('\n');
  }
}

async function main() {
  const args = process.argv.slice(2);

  printHeader();

  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }

  // Run specific challenge
  if (args.length > 0) {
    const challengeId = args[0];
    const challenge = CHALLENGES.find(c => c.id === challengeId);

    if (!challenge) {
      console.log(colorize(`❌ Challenge ${challengeId} not found`, 'red'));
      console.log('\nAvailable challenges:');
      CHALLENGES.forEach(c => {
        console.log(`  ${c.id}: ${c.name}`);
      });
      process.exit(1);
    }

    console.log(colorize(`Running Challenge ${challenge.id}: ${challenge.name}...`, 'cyan'));
    console.log('');

    const result = runTest(challenge);

    if (result.passed) {
      console.log(colorize(`\n✅ Challenge ${challenge.id} passed!`, 'green'));
    } else if (result.skipped) {
      console.log(colorize(`\n⏸️  Challenge ${challenge.id} skipped (${result.output})`, 'yellow'));
    } else {
      console.log(colorize(`\n❌ Challenge ${challenge.id} failed`, 'red'));
      console.log(colorize('\nSee output above for details.', 'yellow'));
    }

    process.exit(result.passed ? 0 : 1);
  }

  // Run all challenges
  console.log(colorize('Running all challenge tests...', 'cyan'));
  console.log(colorize('This may take a minute or two.\n', 'dim'));

  const results = new Map<string, boolean>();

  for (const challenge of CHALLENGES) {
    process.stdout.write(colorize(`Testing Challenge ${challenge.id}: ${challenge.name}... `, 'gray'));

    const result = runTest(challenge);

    if (result.passed) {
      console.log(colorize('✅ PASS', 'green'));
      results.set(challenge.id, true);
    } else if (result.skipped) {
      console.log(colorize('⏸️  SKIP', 'yellow'));
      results.set(challenge.id, false);
    } else {
      console.log(colorize('❌ FAIL', 'red'));
      results.set(challenge.id, false);
    }
  }

  printProgress(results);
}

main().catch((error) => {
  console.error(colorize('\n❌ Error running tests:', 'red'), error.message);
  process.exit(1);
});
