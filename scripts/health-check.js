#!/usr/bin/env node

/**
 * Project Health Check Script
 * Validates the project is ready for OSS publication
 */

const fs = require('fs');
const path = require('path');

// Get the project root directory (one level up from scripts/)
const projectRoot = path.join(__dirname, '..');

const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'src/index.js',
  'src/index.d.ts',
  'test/index.test.js',
  '.github/workflows/test.yml',
  '.github/workflows/release.yml',
  '.eslintrc.json',
  '.prettierrc',
  '.prettierignore',
  'public/test.html'
];

const requiredPackageJsonFields = [
  'name',
  'version',
  'description',
  'main',
  'module',
  'types',
  'exports',
  'files',
  'scripts.test',
  'scripts.build',
  'scripts.lint',
  'scripts.format',
  'author',
  'license',
  'repository'
];

function checkFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${filePath} - MISSING`);
    return false;
  }
}

function checkPackageJson() {
  const packagePath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json - MISSING');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  let allFieldsPresent = true;

  requiredPackageJsonFields.forEach(field => {
    const fieldParts = field.split('.');
    let value = packageJson;

    for (const part of fieldParts) {
      value = value?.[part];
    }

    if (value !== undefined && value !== null && value !== '') {
      console.log(`✅ package.json.${field}`);
    } else {
      console.log(`❌ package.json.${field} - MISSING OR EMPTY`);
      allFieldsPresent = false;
    }
  });

  return allFieldsPresent;
}

function main() {
  console.log('🔍 SidepanelFallback Project Health Check\n');

  console.log('📁 Required Files:');
  const filesOk = requiredFiles.every(checkFile);

  console.log('\n📦 Package.json Fields:');
  const packageOk = checkPackageJson();

  console.log('\n📊 Summary:');
  if (filesOk && packageOk) {
    console.log('🎉 Project is ready for OSS publication!');
    console.log('\nNext steps:');
    console.log('1. Update repository URLs in package.json');
    console.log('2. Set up GitHub repository');
    console.log('3. Configure npm publishing secrets');
    console.log('4. Run: npm run test && npm run build');
    console.log('5. Create initial release tag');
    process.exit(0);
  } else {
    console.log('⚠️  Project needs attention before publication');
    process.exit(1);
  }
}

main();
