#!/usr/bin/env node

/**
 * Structure Validator - Validates project structure and conventions
 */

import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');

const REQUIRED_FILES = ['package.json', 'README.md', '.gitignore', 'biome.json', 'vite.config.js'];

const REQUIRED_DIRECTORIES = ['src', 'scripts', 'data', '.github'];

const EXPECTED_SRC_STRUCTURE = [
  'src/styles',
  'src/scripts',
  'src/templates',
  'src/layouts',
  'src/components',
];

async function checkRequiredFiles() {
  const errors = [];
  const warnings = [];

  console.log('📁 Checking required project files...');

  for (const file of REQUIRED_FILES) {
    const filePath = join(projectRoot, file);
    if (!existsSync(filePath)) {
      errors.push(`Missing required file: ${file}`);
    } else {
      console.log(`✅ ${file}`);
    }
  }

  for (const dir of REQUIRED_DIRECTORIES) {
    const dirPath = join(projectRoot, dir);
    if (!existsSync(dirPath)) {
      errors.push(`Missing required directory: ${dir}`);
    } else {
      console.log(`✅ ${dir}/`);
    }
  }

  return { errors, warnings };
}

async function checkSrcStructure() {
  const errors = [];
  const warnings = [];

  console.log('\n🏗️  Checking src/ structure...');

  for (const expectedPath of EXPECTED_SRC_STRUCTURE) {
    const fullPath = join(projectRoot, expectedPath);
    if (!existsSync(fullPath)) {
      warnings.push(`Expected directory not found: ${expectedPath}`);
    } else {
      console.log(`✅ ${expectedPath}/`);
    }
  }

  return { errors, warnings };
}

async function checkNamingConventions() {
  const errors = [];
  const warnings = [];

  console.log('\n📝 Checking naming conventions...');

  const srcDir = join(projectRoot, 'src');
  await checkDirectoryNaming(srcDir, '', errors, warnings);

  return { errors, warnings };
}

async function checkDirectoryNaming(dir, relativePath, errors, warnings) {
  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const entryRelativePath = join(relativePath, entry).replace(/\\/g, '/');
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Check directory naming
        if (entry.includes(' ')) {
          warnings.push(`Directory contains spaces: ${entryRelativePath}`);
        }

        if (entry !== entry.toLowerCase()) {
          warnings.push(`Directory not lowercase: ${entryRelativePath}`);
        }

        // Recursively check subdirectories
        await checkDirectoryNaming(fullPath, entryRelativePath, errors, warnings);
      } else if (stats.isFile()) {
        // Check file naming
        const ext = extname(entry);
        const name = basename(entry, ext);

        // Check for spaces in filenames
        if (entry.includes(' ')) {
          warnings.push(`File contains spaces: ${entryRelativePath}`);
        }

        // Check HTML files follow convention
        if (ext === '.html') {
          if (
            !entry.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-.+\.html$/) &&
            !entry.match(/^[a-z0-9-]+\.html$/)
          ) {
            warnings.push(`HTML file doesn't follow naming convention: ${entryRelativePath}`);
          }
        }

        // Check CSS files
        if (ext === '.css' && name !== name.toLowerCase()) {
          warnings.push(`CSS file not lowercase: ${entryRelativePath}`);
        }

        // Check JS files
        if (ext === '.js' && name !== name.toLowerCase()) {
          warnings.push(`JS file not lowercase: ${entryRelativePath}`);
        }
      }
    }
  } catch (_error) {
    // Ignore permission errors
  }
}

async function checkPackageJson() {
  const errors = [];
  const warnings = [];

  console.log('\n📦 Checking package.json...');

  try {
    const packagePath = join(projectRoot, 'package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(packageContent);

    // Check required fields
    const requiredFields = ['name', 'version', 'description', 'scripts', 'type'];
    for (const field of requiredFields) {
      if (!pkg[field]) {
        errors.push(`package.json missing required field: ${field}`);
      }
    }

    // Check for required scripts
    const requiredScripts = ['build', 'dev', 'test', 'lint', 'format'];
    for (const script of requiredScripts) {
      if (!pkg.scripts?.[script]) {
        warnings.push(`package.json missing recommended script: ${script}`);
      } else {
        console.log(`✅ Script: ${script}`);
      }
    }

    // Check type is module
    if (pkg.type !== 'module') {
      warnings.push('package.json should have "type": "module" for ESM support');
    }
  } catch (error) {
    errors.push(`Failed to parse package.json: ${error.message}`);
  }

  return { errors, warnings };
}

async function checkGitIgnore() {
  const errors = [];
  const warnings = [];

  console.log('\n🚫 Checking .gitignore...');

  try {
    const gitignorePath = join(projectRoot, '.gitignore');
    const content = await readFile(gitignorePath, 'utf-8');

    const requiredPatterns = ['node_modules', 'dist', '.DS_Store', '*.log'];
    const missingPatterns = [];

    for (const pattern of requiredPatterns) {
      if (!content.includes(pattern)) {
        missingPatterns.push(pattern);
      } else {
        console.log(`✅ Ignores: ${pattern}`);
      }
    }

    if (missingPatterns.length > 0) {
      warnings.push(`Missing .gitignore patterns: ${missingPatterns.join(', ')}`);
    }
  } catch (error) {
    errors.push(`Failed to read .gitignore: ${error.message}`);
  }

  return { errors, warnings };
}

async function validateStructure() {
  console.log('🏗️  Validating project structure...\n');

  try {
    const allErrors = [];
    const allWarnings = [];

    // Run all structure checks
    const checks = [
      checkRequiredFiles,
      checkSrcStructure,
      checkNamingConventions,
      checkPackageJson,
      checkGitIgnore,
    ];

    for (const check of checks) {
      const { errors, warnings } = await check();
      allErrors.push(...errors);
      allWarnings.push(...warnings);
    }

    // Summary
    console.log('\n📊 Structure Validation Summary:');
    console.log(`   Errors: ${allErrors.length}`);
    console.log(`   Warnings: ${allWarnings.length}`);

    if (allErrors.length > 0) {
      console.log('\n❌ Structure validation failed:');
      allErrors.forEach((error) => {
        console.log(`   • ${error}`);
      });
    }

    if (allWarnings.length > 0) {
      console.log('\n⚠️  Structure warnings:');
      allWarnings.forEach((warning) => {
        console.log(`   • ${warning}`);
      });
    }

    if (allErrors.length > 0) {
      console.log('\n❌ Project structure validation failed');
      process.exit(1);
    } else {
      console.log('\n✅ Project structure is valid');
      if (allWarnings.length > 0) {
        console.log('💡 Consider addressing warnings for better consistency');
      }
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Structure validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateStructure().catch((error) => {
    console.error('❌ Structure validation script failed:', error);
    process.exit(1);
  });
}

export { validateStructure };
