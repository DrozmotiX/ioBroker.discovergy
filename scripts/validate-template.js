#!/usr/bin/env node

/**
 * ioBroker Adapter Template Validator
 *
 * This script validates that the repository follows ioBroker adapter template standards
 * and checks template version compatibility.
 */

const fs = require('fs');
const path = require('path');

/**
 * Template validator class for ioBroker adapters
 */
class TemplateValidator {
    /**
     * Initialize the validator
     */
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.templateVersion = '1.0.0'; // Current template version
    }

    /**
     * Validate required files exist
     */
    validateRequiredFiles() {
        const requiredFiles = [
            'package.json',
            'io-package.json',
            'main.js',
            'README.md',
            'LICENSE',
            '.github/workflows/test-and-release.yml',
            '.github/copilot-instructions.md',
        ];

        const optionalFiles = [
            'admin/index_m.html',
            'lib/adapter-config.d.ts',
            '.eslintrc.json',
            'eslint.config.mjs',
            'tsconfig.json',
            'gulpfile.js',
            '.vscode/settings.json',
        ];

        console.log('🔍 Checking required files...');

        for (const file of requiredFiles) {
            if (!fs.existsSync(path.resolve(file))) {
                this.errors.push(`Missing required file: ${file}`);
            } else {
                console.log(`✅ ${file}`);
            }
        }

        console.log('\n🔍 Checking optional files...');
        for (const file of optionalFiles) {
            if (fs.existsSync(path.resolve(file))) {
                console.log(`✅ ${file}`);
            } else {
                console.log(`⚠️  Optional file missing: ${file}`);
            }
        }
    }

    /**
     * Validate package.json structure
     */
    validatePackageJson() {
        console.log('\n🔍 Validating package.json...');

        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

            // Required fields
            const requiredFields = ['name', 'version', 'description', 'author', 'license', 'repository'];
            for (const field of requiredFields) {
                if (!pkg[field]) {
                    this.errors.push(`package.json missing required field: ${field}`);
                } else {
                    console.log(`✅ package.json.${field}`);
                }
            }

            // Check adapter name format
            if (pkg.name && !pkg.name.startsWith('iobroker.')) {
                this.warnings.push('package.json name should start with "iobroker."');
            }

            // Check for required scripts
            const requiredScripts = ['test:package', 'lint'];
            const optionalScripts = ['test:unit', 'test:integration', 'release'];

            console.log('\n🔍 Checking npm scripts...');
            for (const script of requiredScripts) {
                if (!pkg.scripts || !pkg.scripts[script]) {
                    this.errors.push(`package.json missing required script: ${script}`);
                } else {
                    console.log(`✅ script: ${script}`);
                }
            }

            for (const script of optionalScripts) {
                if (pkg.scripts && pkg.scripts[script]) {
                    console.log(`✅ script: ${script}`);
                }
            }
        } catch (error) {
            this.errors.push(`Error reading package.json: ${error.message}`);
        }
    }

    /**
     * Validate io-package.json structure
     */
    validateIoPackageJson() {
        console.log('\n🔍 Validating io-package.json...');

        try {
            const ioPackage = JSON.parse(fs.readFileSync('io-package.json', 'utf8'));

            // Required common fields
            const requiredCommonFields = ['name', 'version', 'titleLang', 'desc', 'authors', 'type'];
            for (const field of requiredCommonFields) {
                if (!ioPackage.common || !ioPackage.common[field]) {
                    this.errors.push(`io-package.json missing required common field: ${field}`);
                } else {
                    console.log(`✅ io-package.json.common.${field}`);
                }
            }

            // Check version sync with package.json
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (ioPackage.common?.version !== pkg.version) {
                this.errors.push('Version mismatch between package.json and io-package.json');
            } else {
                console.log('✅ Version sync between package.json and io-package.json');
            }

            // Check for admin UI
            if (ioPackage.common?.adminUI) {
                if (ioPackage.common.adminUI.config !== 'json') {
                    this.warnings.push('Consider using JSON config for admin UI (adminUI.config = "json")');
                } else {
                    console.log('✅ Using JSON config for admin UI');
                }
            }
        } catch (error) {
            this.errors.push(`Error reading io-package.json: ${error.message}`);
        }
    }

    /**
     * Validate GitHub Copilot instructions
     */
    validateCopilotInstructions() {
        console.log('\n🔍 Validating GitHub Copilot instructions...');

        const copilotFile = '.github/copilot-instructions.md';
        if (fs.existsSync(copilotFile)) {
            const content = fs.readFileSync(copilotFile, 'utf8');

            // Check for essential sections
            const requiredSections = [
                '# ioBroker.',
                '## Working Effectively',
                '## Project Structure',
                '## Technology Stack',
            ];

            for (const section of requiredSections) {
                if (content.includes(section)) {
                    console.log(`✅ Copilot instructions contain: ${section}`);
                } else {
                    this.warnings.push(`Copilot instructions missing recommended section: ${section}`);
                }
            }

            // Check for template version reference
            if (content.includes('template') && content.includes('version')) {
                console.log('✅ Copilot instructions mention template versioning');
            } else {
                this.warnings.push('Consider adding template version information to copilot instructions');
            }
        } else {
            this.errors.push('Missing GitHub Copilot instructions file');
        }
    }

    /**
     * Validate GitHub Actions workflow
     */
    validateGitHubActions() {
        console.log('\n🔍 Validating GitHub Actions...');

        const workflowFile = '.github/workflows/test-and-release.yml';
        if (fs.existsSync(workflowFile)) {
            console.log('✅ GitHub Actions workflow exists');

            const content = fs.readFileSync(workflowFile, 'utf8');

            // Check for Node.js testing
            if (content.includes('node-version')) {
                console.log('✅ GitHub Actions includes Node.js testing');
            }

            // Check for multiple OS testing
            if (content.includes('ubuntu') && (content.includes('windows') || content.includes('macos'))) {
                console.log('✅ GitHub Actions tests on multiple operating systems');
            }
        } else {
            this.errors.push('Missing GitHub Actions workflow file');
        }
    }

    /**
     * Check template version compatibility
     */
    validateTemplateVersion() {
        console.log('\n🔍 Checking template version compatibility...');

        // Check if package.json has template version info
        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (pkg.templateVersion) {
                console.log(`📋 Template version: ${pkg.templateVersion}`);

                if (pkg.templateVersion !== this.templateVersion) {
                    this.warnings.push(
                        `Template version ${pkg.templateVersion} might be outdated. Current: ${this.templateVersion}`,
                    );
                }
            } else {
                this.warnings.push('No template version specified in package.json');
            }
        } catch {
            // Package.json validation will catch this
        }

        console.log(`📋 Expected template version: ${this.templateVersion}`);
    }

    /**
     * Run all validations
     */
    validate() {
        console.log('🚀 Starting ioBroker Adapter Template Validation\n');
        console.log('==========================================\n');

        this.validateRequiredFiles();
        this.validatePackageJson();
        this.validateIoPackageJson();
        this.validateCopilotInstructions();
        this.validateGitHubActions();
        this.validateTemplateVersion();

        this.showResults();
        return this.errors.length === 0;
    }

    /**
     * Show validation results
     */
    showResults() {
        console.log('\n==========================================');
        console.log('📊 VALIDATION RESULTS');
        console.log('==========================================\n');

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 All validations passed! Your adapter follows ioBroker template standards.');
        } else {
            if (this.errors.length > 0) {
                console.log('❌ ERRORS:');
                this.errors.forEach(error => console.log(`  • ${error}`));
                console.log('');
            }

            if (this.warnings.length > 0) {
                console.log('⚠️  WARNINGS:');
                this.warnings.forEach(warning => console.log(`  • ${warning}`));
                console.log('');
            }

            console.log(`📈 Summary: ${this.errors.length} error(s), ${this.warnings.length} warning(s)`);

            if (this.errors.length === 0) {
                console.log('✅ No blocking issues found - adapter is template compliant!');
            }
        }

        console.log('\n📚 For more information, see: .github/copilot-instructions.md');
        console.log('🔗 ioBroker template: https://github.com/ioBroker/ioBroker.example');
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new TemplateValidator();
    const success = validator.validate();
    process.exit(success ? 0 : 1);
}

module.exports = TemplateValidator;
