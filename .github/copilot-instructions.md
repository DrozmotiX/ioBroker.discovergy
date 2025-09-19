# ioBroker.discovergy

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

### ioBroker.discovergy Specific Context
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

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', () => new Promise(async (resolve) => {
                // Get adapter object and configure
                harness.objects.getObject('system.adapter.discovergy.0', async (err, obj) => {
                    if (err) {
                        console.error('Error getting adapter object:', err);
                        resolve();
                        return;
                    }

                    // Configure adapter properties
                    obj.native.Username = 'demo@inexogy.com';
                    obj.native.Password = 'demo';
                    obj.native.Polltime = 30;
                    // ... other configuration

                    // Set the updated configuration
                    harness.objects.setObject(obj._id, obj);

                    // Start adapter and wait
                    await harness.startAdapterAndWait();

                    // Wait for adapter to process data
                    setTimeout(() => {
                        // Verify states were created
                        harness.states.getState('discovergy.0.info.connection', (err, state) => {
                            if (state && state.val === true) {
                                console.log('✅ Adapter started successfully');
                            }
                            resolve();
                        });
                    }, 15000); // Allow time for API calls
                });
            })).timeout(30000);
        });
    }
});
```

#### Testing Both Success AND Failure Scenarios

**IMPORTANT**: For every "it works" test, implement corresponding "it doesn't work and fails" tests. This ensures proper error handling and validates that your adapter fails gracefully when expected.

```javascript
// Example: Testing successful configuration
it('should configure and start adapter with valid configuration', () => new Promise(async (resolve) => {
    // ... successful configuration test as shown above
})).timeout(30000);

// Example: Testing failure scenarios
it('should fail gracefully with invalid configuration', () => new Promise(async (resolve) => {
    harness.objects.getObject('system.adapter.discovergy.0', async (err, obj) => {
        if (err) {
            console.error('Error getting adapter object:', err);
            resolve();
            return;
        }

        // Configure with INVALID data to test failure handling
        obj.native.Username = 'invalid-user@invalid.com';
        obj.native.Password = 'invalid-password';

        harness.objects.setObject(obj._id, obj);

        try {
            await harness.startAdapterAndWait();
            
            setTimeout(() => {
                // Verify adapter handled the error properly
                harness.states.getState('discovergy.0.info.connection', (err, state) => {
                    if (state && state.val === false) {
                        console.log('✅ Adapter properly failed with invalid configuration');
                    } else {
                        console.log('❌ Adapter should have failed but connection shows true');
                    }
                    resolve();
                });
            }, 15000);
        } catch (error) {
            console.log('✅ Adapter correctly threw error with invalid configuration:', error.message);
            resolve();
        }
    });
})).timeout(30000);
```

#### Advanced State Access Patterns

For testing adapters that create multiple states, use bulk state access methods to efficiently verify large numbers of states:

```javascript
it('should create and verify multiple meter states', () => new Promise(async (resolve, reject) => {
    // Configure and start adapter first...
    harness.objects.getObject('system.adapter.discovergy.0', async (err, obj) => {
        if (err) {
            console.error('Error getting adapter object:', err);
            reject(err);
            return;
        }

        // Configure adapter as needed
        obj.native.Username = 'demo@inexogy.com';
        obj.native.Password = 'demo';
        harness.objects.setObject(obj._id, obj);

        await harness.startAdapterAndWait();

        // Wait for adapter to create states
        setTimeout(() => {
            // Access bulk states using pattern matching
            harness.dbConnection.getStateIDs('discovergy.0.*').then(stateIds => {
                if (stateIds && stateIds.length > 0) {
                    harness.states.getStates(stateIds, (err, allStates) => {
                        if (err) {
                            console.error('❌ Error getting states:', err);
                            reject(err); // Properly fail the test instead of just resolving
                            return;
                        }

                        // Verify states were created and have expected values
                        const expectedStates = ['discovergy.0.info.connection', 'discovergy.0.meters.0.power'];
                        let foundStates = 0;
                        
                        for (const stateId of expectedStates) {
                            if (allStates[stateId]) {
                                foundStates++;
                                console.log(`✅ Found expected state: ${stateId}`);
                            } else {
                                console.log(`❌ Missing expected state: ${stateId}`);
                            }
                        }

                        if (foundStates === expectedStates.length) {
                            console.log('✅ All expected states were created successfully');
                            resolve();
                        } else {
                            reject(new Error(`Only ${foundStates}/${expectedStates.length} expected states were found`));
                        }
                    });
                } else {
                    reject(new Error('No states found matching pattern discovergy.0.*'));
                }
            }).catch(reject);
        }, 20000); // Allow more time for multiple state creation
    });
})).timeout(45000);
```

#### Key Integration Testing Rules

1. **NEVER test API URLs directly** - Let the adapter handle API calls
2. **ALWAYS use the harness** - `getHarness()` provides the testing environment  
3. **Configure via objects** - Use `harness.objects.setObject()` to set adapter configuration
4. **Start properly** - Use `harness.startAdapterAndWait()` to start the adapter
5. **Check states** - Use `harness.states.getState()` to verify results
6. **Use timeouts** - Allow time for async operations with appropriate timeouts
7. **Test real workflow** - Initialize → Configure → Start → Verify States

#### Workflow Dependencies
Integration tests should run ONLY after lint and adapter tests pass:

```yaml
integration-tests:
  needs: [check-and-lint, adapter-tests]
  runs-on: ubuntu-latest
  steps:
    - name: Run integration tests
      run: npx mocha test/integration-*.js --exit
```

#### What NOT to Do
❌ Direct API testing: `axios.get('https://api.example.com')`
❌ Mock adapters: `new MockAdapter()`  
❌ Direct internet calls in tests
❌ Bypassing the harness system

#### What TO Do
✅ Use `@iobroker/testing` framework
✅ Configure via `harness.objects.setObject()`
✅ Start via `harness.startAdapterAndWait()`
✅ Test complete adapter lifecycle
✅ Verify states via `harness.states.getState()`
✅ Allow proper timeouts for async operations

### API Testing with Credentials
For adapters that connect to external APIs requiring authentication, implement comprehensive credential testing:

#### Password Encryption for Integration Tests
When creating integration tests that need encrypted passwords (like those marked as `encryptedNative` in io-package.json):

1. **Read system secret**: Use `harness.objects.getObjectAsync("system.config")` to get `obj.native.secret`
2. **Apply XOR encryption**: Implement the encryption algorithm:
   ```javascript
   async function encryptPassword(harness, password) {
       const systemConfig = await harness.objects.getObjectAsync("system.config");
       if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
           throw new Error("Could not retrieve system secret for password encryption");
       }
       
       const secret = systemConfig.native.secret;
       let result = '';
       for (let i = 0; i < password.length; ++i) {
           result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
       }
       return result;
   }
   ```
3. **Store encrypted password**: Set the encrypted result in adapter config, not the plain text
4. **Result**: Adapter will properly decrypt and use credentials, enabling full API connectivity testing

#### Demo Credentials Testing
- Demo credentials `demo@inexogy.com` / `demo` are working and provide access to multiple test meters
- Proper encryption enables full API connectivity validation in integration tests
- Test should fail clearly with recognizable error messages for API issues
- Expected success log: "All meters initialized, polling data every 30 seconds"

#### Enhanced Test Failure Handling
```javascript
it("Should connect to API with demo credentials", async () => {
    // ... setup and encryption logic ...
    
    const connectionState = await harness.states.getStateAsync("discovergy.0.info.connection");
    
    if (connectionState && connectionState.val === true) {
        console.log("✅ SUCCESS: API connection established");
        return true;
    } else {
        throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
            "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
    }
}).timeout(120000); // Extended timeout for API calls
```

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

## README Updates

### Required Sections
When updating README.md files, ensure these sections are present and well-documented:

1. **Installation** - Clear npm/ioBroker admin installation steps
2. **Configuration** - Detailed configuration options with examples
3. **Usage** - Practical examples and use cases
4. **Changelog** - Version history and changes (use "## **WORK IN PROGRESS**" section for ongoing changes following AlCalzone release-script standard)
5. **License** - License information (typically MIT for ioBroker adapters)
6. **Support** - Links to issues, discussions, and community support

### Documentation Standards
- Use clear, concise language
- Include code examples for configuration
- Add screenshots for admin interface when applicable
- Maintain multilingual support (at minimum English and German)
- When creating PRs, add entries to README under "## **WORK IN PROGRESS**" section following ioBroker release script standard
- Always reference related issues in commits and PR descriptions (e.g., "solves #xx" or "fixes #xx")

### README Update Requirements
For **every PR or new feature**, always add a user-friendly entry to README.md:
- Add entries under `### __WORK IN PROGRESS__` section before committing
- Use format: `* (author) **TYPE**: Description of user-visible change`
- Types: **NEW** (features), **FIXED** (bugs), **ENHANCED** (improvements), **TESTING** (test additions), **CI/CD** (automation)
- Focus on user impact, not technical implementation details
- Example: `* (DutchmanNL) **FIXED**: Adapter now properly validates login credentials instead of always showing "credentials missing"`

### Changelog Management with AlCalzone Release-Script
Follow the [AlCalzone release-script](https://github.com/AlCalzone/release-script) standard for changelog management:

#### Format Requirements
- Always use `## **WORK IN PROGRESS**` as the placeholder for new changes
- Add all PR/commit changes under this section until ready for release
- Never modify version numbers manually - only when merging to main branch
- Maintain this format in README.md or CHANGELOG.md:

```markdown
# Changelog

<!--
  Placeholder for the next version (at the beginning of the line):
  ## **WORK IN PROGRESS**
-->

## **WORK IN PROGRESS**

-   Did some changes
-   Did some more changes

## v0.1.0 (2023-01-01)
Initial release
```

#### Workflow Process
- **During Development**: All changes go under `## **WORK IN PROGRESS**`
- **For Every PR**: Add user-facing changes to the WORK IN PROGRESS section
- **Before Merge**: Version number and date are only added when merging to main
- **Release Process**: The release-script automatically converts the placeholder to the actual version

#### Change Entry Format
Use this consistent format for changelog entries:
- `- (author) **TYPE**: User-friendly description of the change`
- Types: **NEW** (features), **FIXED** (bugs), **ENHANCED** (improvements)
- Focus on user impact, not technical implementation details
- Reference related issues: "fixes #XX" or "solves #XX"

#### Example Entry
```markdown
## **WORK IN PROGRESS**

- (DutchmanNL) **FIXED**: Adapter now properly validates login credentials instead of always showing "credentials missing" (fixes #25)
- (DutchmanNL) **NEW**: Added support for device discovery to simplify initial setup
```

### Documentation Workflow Standards
- **Mandatory README updates**: Establish requirement to update README.md for every PR/feature
- **Standardized documentation**: Create consistent format and categories for changelog entries
- **Enhanced development workflow**: Integrate documentation requirements into standard development process

## Dependency Updates

### Package Management
- Always use `npm` for dependency management in ioBroker adapters
- Keep dependencies minimal and focused
- Regularly update dependencies to latest stable versions
- Use `npm audit` to check for security vulnerabilities
- Before committing, ensure package.json and package-lock.json are in sync by running `npm install`

### Dependency Best Practices
- Prefer built-in Node.js modules when possible
- Use `@iobroker/adapter-core` for adapter base functionality
- Avoid deprecated packages
- Document any specific version requirements

## JSON-Config Admin Instructions

### Configuration Schema
When creating admin configuration interfaces:

- Use JSON-Config format for modern ioBroker admin interfaces
- Provide clear labels and help text for all configuration options
- Include input validation and error messages
- Group related settings logically
- Example structure:
  ```json
  {
    "type": "panel",
    "items": {
      "Username": {
        "type": "text",
        "label": "Username",
        "help": "Your Discovergy/Inexogy username/email"
      },
      "Password": {
        "type": "password",
        "label": "Password",
        "help": "Your Discovergy/Inexogy password"
      }
    }
  }
  ```

### Admin Interface Guidelines
- Use consistent naming conventions
- Provide sensible default values
- Include validation for required fields
- Add tooltips for complex configuration options
- Ensure translations are available for all supported languages (minimum English and German)
- Write end-user friendly labels and descriptions, avoiding technical jargon where possible

## Best Practices for Dependencies

### HTTP Client Libraries
- **Preferred:** Use native `fetch` API (available in Node.js 18+)
- **Alternative:** Use `node-fetch` for older Node.js versions
- **Avoid:** `axios` unless specific features are required (reduces bundle size)

### Example with fetch:
```javascript
try {
  const response = await fetch('https://api.inexogy.com/data');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
} catch (error) {
  this.log.error(`API request failed: ${error.message}`);
}
```

### Other Dependency Recommendations
- **Logging:** Use adapter built-in logging (`this.log.*`)
- **Scheduling:** Use adapter built-in timers and intervals
- **File operations:** Use Node.js `fs/promises` for async file operations
- **Configuration:** Use adapter config system rather than external config libraries

## Error Handling

### Adapter Error Patterns
- Always catch and log errors appropriately
- Use adapter log levels (error, warn, info, debug)
- Provide meaningful, user-friendly error messages that help users understand what went wrong
- Handle network failures gracefully
- Implement retry mechanisms where appropriate
- Always clean up timers, intervals, and other resources in the `unload()` method

### Example Error Handling:
```javascript
try {
  await this.connectToDevice();
} catch (error) {
  this.log.error(`Failed to connect to Discovergy API: ${error.message}`);
  this.setState('info.connection', false, true);
  // Implement retry logic if needed
}
```

### Timer and Resource Cleanup:
```javascript
// In your adapter class
private connectionTimer?: NodeJS.Timeout;

async onReady() {
  this.connectionTimer = setInterval(() => {
    this.checkConnection();
  }, 30000);
}

onUnload(callback) {
  try {
    // Clean up timers and intervals
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      this.connectionTimer = undefined;
    }
    // Close connections, clean up resources
    callback();
  } catch (e) {
    callback();
  }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo");
                
                await harness.changeAdapterConfig("discovergy", {
                    native: {
                        Username: "demo@inexogy.com",
                        Password: encryptedPassword,
                        Polltime: 30,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("discovergy.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```