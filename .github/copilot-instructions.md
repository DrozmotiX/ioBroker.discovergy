# ioBroker.discovergy
An ioBroker adapter for Discovergy power measurement meters that uses the Discovergy API to read meter data and synchronize it to ioBroker.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

**NEVER CANCEL BUILDS OR LONG-RUNNING COMMANDS.** Some operations may take several minutes. Set appropriate timeouts.

### Bootstrap and Install Dependencies
- `npm install` -- takes ~22 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
  - ⚠️ **Expect security audit warnings** - the project uses deprecated packages (request, form-data, etc.) that are part of legacy ioBroker infrastructure
  - ⚠️ **22 known vulnerabilities** exist but are not blocking for development

### Build and Validation Commands
- `npm run lint` -- takes <1 second. Runs ESLint validation.
- `npm run test:package` -- takes <1 second. Validates package.json and io-package.json structure.
- `npm run test:unit` -- takes <1 second. Runs minimal unit tests (mostly deprecated).
- `npm run test:integration` -- takes ~45 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
  - ⚠️ **Expected behavior**: Shows "credentials missing" error - this is normal without Discovergy API credentials
- `npm run test:js` -- **FAILS** due to deprecated mocha.opts configuration
- `npm run test` -- **FAILS** due to test:js failure
- `npx tsc --noEmit` -- takes ~4 seconds. Type checking (expect errors, project is primarily JavaScript)
- `npx gulp default` -- takes <1 second. Updates package versions and README
- `npx gulp --tasks` -- lists available gulp tasks for internationalization and build

### Working with the Adapter
- **DO NOT** try to run `node main.js` directly - it will fail with "Cannot find js-controller"
- The adapter must be run within ioBroker environment or via integration tests
- Test credentials: username=`demo@discovergy.com`, password=`demo` (from Discovergy demo account)

## Validation
- Always run `npm run lint` before committing changes - the CI will fail without it
- Always run `npm run test:package` to validate package structure
- Always run `npm run test:integration` to ensure adapter starts correctly (expect ~45 seconds)
- **MANUAL TESTING**: Use demo credentials to test actual API functionality (requires internet access to api.discovergy.com)
- Security audit warnings are expected - do not attempt to fix them unless specifically requested

## Project Structure and Navigation

### Key Entry Points
- `main.js` - Main adapter implementation (JavaScript)
- `package.json` - Dependencies and npm scripts
- `io-package.json` - ioBroker adapter metadata and configuration

### Important Directories
- `admin/` - Admin UI configuration (JSON Config) and translations
- `lib/` - Shared libraries and utilities
  - `lib/stateAttr.js` - State attribute definitions for meter readings
  - `lib/tools.js` - Utility functions including translation tools
  - `lib/adapter-config.d.ts` - TypeScript definitions for adapter config
- `test/` - Test files (package, integration, unit, mocha setup)
- `.github/workflows/` - CI/CD configuration (test-and-release.yml)

### Configuration Files
- `.eslintrc.json` - ESLint code style rules
- `tsconfig.json` - TypeScript configuration (type checking only, no compilation)
- `gulpfile.js` - Build tasks for internationalization and versioning
- `.releaseconfig.json` - Release automation configuration

### Common Files to Check After Changes
- Always check `io-package.json` after modifying adapter metadata
- Always check translation files in `admin/i18n/` after changing UI text
- Always check `lib/stateAttr.js` after adding new meter reading types

## Technology Stack
- **Runtime**: Node.js (supports 20.x, 22.x)
- **Language**: JavaScript (ES2015+ with some TypeScript definitions)
- **Framework**: ioBroker adapter-core v3.0.4
- **HTTP Client**: request-promise-native (deprecated but functional)
- **Testing**: Mocha + Chai + Sinon with @iobroker/testing framework
- **Linting**: ESLint v7.32.0
- **Build System**: Gulp for internationalization tasks
- **CI/CD**: GitHub Actions (test on Ubuntu, Windows, macOS)

## Common Tasks

### Repository Root Contents
```
.
├── .eslintrc.json          # ESLint configuration
├── .github/                # GitHub workflows and templates
├── admin/                  # Admin UI and translations
├── gulpfile.js            # Build tasks
├── io-package.json        # ioBroker adapter metadata
├── lib/                   # Shared libraries
├── main.js               # Main adapter implementation
├── package.json          # Node.js dependencies and scripts
├── README.md             # Documentation
├── test/                 # Test files
└── tsconfig.json         # TypeScript configuration
```

### Package.json Scripts Summary
```json
{
  "test:js": "mocha --opts test/mocha.custom.opts",     // BROKEN - deprecated
  "test:package": "mocha test/package --exit",          // ✅ Works - 38 tests
  "test:unit": "mocha test/unit --exit",                // ✅ Works - 1 test
  "test:integration": "mocha test/integration --exit",  // ✅ Works - takes 45s
  "test": "npm run test:js && npm run test:package",    // BROKEN - due to test:js
  "lint": "eslint",                                     // ✅ Works - <1s
  "release": "release-script --all",                    // Production releases
  "release-dry": "release-script --all --dry"          // Test releases
}
```

### Expected Command Execution Times
- `npm install`: ~22 seconds
- `npm run lint`: <1 second
- `npm run test:package`: <1 second  
- `npm run test:unit`: <1 second
- `npm run test:integration`: ~45 seconds (**NEVER CANCEL**)
- `npx tsc --noEmit`: ~4 seconds
- `npx gulp default`: <1 second

### Known Issues and Workarounds
1. **test:js fails**: mocha.opts is deprecated - use individual test commands instead
2. **Security vulnerabilities**: Expected due to legacy dependencies - do not fix unless specifically requested
3. **TypeScript errors**: Expected since project is JavaScript with optional type checking
4. **Direct node execution fails**: Adapter requires ioBroker environment
5. **Integration test "errors"**: "credentials missing" message is expected behavior

## Development Workflow
1. Make code changes
2. Run `npm run lint` to check code style
3. Run `npm run test:package` to validate package structure  
4. Run `npm run test:integration` to test adapter startup (45 seconds)
5. Test functionality with demo credentials if API changes made
6. **ALWAYS** update README.md with user-friendly description of changes under `### __WORK IN PROGRESS__` section
7. Commit changes (CI will run full test matrix on Node 20.x/22.x across Ubuntu/Windows/macOS)

### README Update Requirements
For **every PR or new feature**, always add a user-friendly entry to README.md:
- Add entries under `### __WORK IN PROGRESS__` section before committing
- Use format: `* (author) **TYPE**: Description of user-visible change`
- Types: **NEW** (features), **FIXED** (bugs), **ENHANCED** (improvements), **TESTING** (test additions), **CI/CD** (automation)
- Focus on user impact, not technical implementation details
- Example: `* (DutchmanNL) **FIXED**: Adapter now properly validates login credentials instead of always showing "credentials missing"`

## Testing with Credentials (Lessons Learned)

### Password Encryption for Integration Tests
When creating integration tests that need encrypted passwords (like those marked as `encryptedNative` in io-package.json):

1. **Read system secret**: Use `harness.objects.getObjectAsync("system.config")` to get `obj.native.secret`
2. **Apply XOR encryption**: Implement the encryption algorithm:
   ```javascript
   function encryptPassword(secret, password) {
       let result = '';
       for (let i = 0; i < password.length; ++i) {
           result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
       }
       return result;
   }
   ```
3. **Store encrypted password**: Set the encrypted result in adapter config, not the plain text
4. **Result**: Adapter will properly decrypt and use credentials, enabling full API connectivity testing

### Demo Credentials Testing
- Demo credentials `demo@inexogy.com` / `demo` are working and provide access to multiple test meters
- Proper encryption enables full API connectivity validation in integration tests
- Test should fail clearly with recognizable error messages for API issues
- Expected success log: "All meters initialized, polling data every 30 seconds"