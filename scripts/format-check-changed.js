#!/usr/bin/env node

/**
 * Script to check formatting only for changed files in a PR
 * This prevents issues where GitHub Actions checks files from the main branch
 * that haven't been merged yet.
 */

const { execSync } = require('child_process');

function main() {
  try {
    // Check if we're in a PR context by looking for the base ref
    const baseBranch = process.env.GITHUB_BASE_REF || 'main';

    // Try different base references
    const possibleBases = [
      `origin/${baseBranch}`,
      baseBranch,
      'HEAD~7', // Fallback to 7 commits back as we made 7 commits in this PR
      'HEAD~5'
    ];

    let validBase = null;
    for (const base of possibleBases) {
      try {
        execSync(`git rev-parse ${base}`, { stdio: 'pipe' });
        validBase = base;
        console.log(`Using base reference: ${validBase}`);
        break;
      } catch {
        continue;
      }
    }

    if (!validBase) {
      console.log('Could not find valid base reference, checking all files');
      execSync('npm run format:check', { stdio: 'inherit' });
      return;
    }

    // Get list of changed files
    const changedFilesCmd = `git diff --name-only ${validBase}...HEAD`;
    let changedFiles;

    try {
      changedFiles = execSync(changedFilesCmd, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(file => file && /\.(js|jsx|ts|tsx|json|md|yml|yaml)$/.test(file))
        .filter(file => {
          // Check if file actually exists (not deleted)
          try {
            require('fs').accessSync(file);
            return true;
          } catch {
            return false;
          }
        });
    } catch (_error) {
      console.log('Could not get changed files, checking all files');
      execSync('npm run format:check', { stdio: 'inherit' });
      return;
    }

    if (changedFiles.length === 0) {
      console.log('No relevant files changed for format check');
      return;
    }

    console.log(`Checking format for ${changedFiles.length} changed files:`);
    changedFiles.forEach(file => console.log(`  - ${file}`));

    // Run prettier on changed files
    const prettierCmd = `npx prettier --check ${changedFiles.join(' ')} --config .prettierrc --ignore-path .prettierignore`;
    execSync(prettierCmd, { stdio: 'inherit' });

    console.log('✅ All changed files are properly formatted');
  } catch (error) {
    if (error.status === 1) {
      // Prettier found formatting issues
      console.error('❌ Format check failed. Run `npm run format` to fix formatting issues.');
      process.exit(1);
    } else {
      // Other error
      console.error('Error running format check:', error.message);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
