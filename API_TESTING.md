# API Testing with Demo Credentials

This document explains how to test the ioBroker Discovergy adapter with the provided demo credentials.

## Demo Credentials

The Discovergy/Inexogy service provides demo credentials for testing purposes:
- Username: `demo@inexogy.com`  
- Password: `demo`

**Note**: As of recent testing, these demo credentials return a 401 Unauthorized response from the API, suggesting they may no longer be valid or have been changed.

## Running the Test

To test the adapter with demo credentials:

```bash
npm run test:integration-demo
```

This will:
1. Configure the adapter with demo credentials
2. Start the adapter
3. Attempt to connect to the Inexogy API at `api.inexogy.com`
4. Validate that credentials are properly handled

## Expected Behavior

### With Valid Demo Credentials

When the demo credentials are valid and the test environment has internet access, the adapter should:

1. Successfully connect to the API
2. Retrieve meter information from the demo account
3. Initialize all meters
4. Log the message: **"All meters initialized, polling data every 30 seconds"**
5. Begin polling meter data at the configured interval
6. Set `info.connection` state to `true`

### With Invalid/Outdated Demo Credentials

Currently, the demo credentials appear to be invalid, resulting in:
1. Successful credentials configuration (no "credentials missing" error)
2. API connection attempt to `api.inexogy.com`
3. HTTP 401 Unauthorized response
4. Connection state remains `false`

### In CI/Test Environments

The test is designed to pass in CI environments because:
1. It validates that the credentials bug is fixed
2. It confirms the adapter attempts API connection
3. It handles network access limitations gracefully
4. Invalid demo credentials don't cause test failures

## GitHub Actions Integration

The test runs automatically as part of the CI pipeline:
- Runs separately from other tests on `ubuntu-22.04`
- Uses Node.js 20.x
- Validates credentials handling without requiring valid demo credentials

## Manual Testing

For manual testing with real credentials:
1. Install and configure the adapter in your ioBroker instance
2. Set your actual Discovergy/Inexogy credentials
3. Start the adapter
4. Check the logs for the expected initialization message

## Fixed Issues

This test verifies the fix for the credentials validation bug where `settings.user` was incorrectly used instead of `settings.Username` in the adapter code. The test ensures:

- ✅ Credentials are properly loaded from config
- ✅ Password encryption/decryption works correctly  
- ✅ API connection is attempted with credentials
- ✅ No "credentials missing" errors with valid config