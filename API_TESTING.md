# API Testing with Demo Credentials

This document explains how to test the ioBroker Discovergy adapter with the provided demo credentials.

## Demo Credentials

The Discovergy/Inexogy service provides demo credentials for testing purposes:
- Username: `demo@inexogy.com`  
- Password: `demo`

**✅ Status**: These demo credentials are confirmed to be working and provide access to multiple test meters.

## Running the Test

To test the adapter with demo credentials:

```bash
npm run test:integration-demo
```

This will:
1. Configure the adapter with demo credentials (using proper password encryption)
2. Start the adapter
3. Connect to the Inexogy API at `api.inexogy.com`
4. Initialize multiple test meters
5. Verify the expected success message is logged

## Expected Behavior

### With Valid Demo Credentials ✅

The demo credentials are currently working and the adapter will:

1. ✅ Successfully connect to the API
2. ✅ Retrieve meter information from multiple demo meters
3. ✅ Initialize all meters
4. ✅ Log the message: **"All meters initialized, polling data every 30 seconds"**
5. ✅ Begin polling meter data at the configured interval
6. ✅ Set `info.connection` state to `true`

### Test Implementation Details

The test implements proper password encryption using ioBroker's encryption algorithm:
- Reads the system secret from `system.config`
- Encrypts the password using XOR cipher with the secret
- Stores the encrypted password in the adapter configuration
- This matches how passwords are handled in the real ioBroker admin interface

## GitHub Actions Integration

The test runs automatically as part of the CI pipeline:
- Runs separately from other tests on `ubuntu-22.04`
- Uses Node.js 20.x
- Successfully validates full API connectivity and meter initialization
- Required to pass for complete validation

## Manual Testing

For manual testing with real credentials:
1. Install and configure the adapter in your ioBroker instance
2. Set your actual Discovergy/Inexogy credentials in the admin interface
3. Start the adapter
4. Check the logs for the expected initialization message

## Test Results

Recent test run shows successful operation:
- ✅ Password encryption working correctly
- ✅ API connection established (`connection: true`)
- ✅ Multiple meters discovered and initialized
- ✅ Expected log message: "All meters initialized, polling data every 30 seconds"
- ✅ Continuous meter data polling working

## Fixed Issues

This test verifies the fix for the credentials validation bug where `settings.user` was incorrectly used instead of `settings.Username` in the adapter code. The test ensures:

- ✅ Credentials are properly loaded from config
- ✅ Password encryption/decryption works correctly  
- ✅ API connection is established successfully
- ✅ No "credentials missing" errors with valid config
- ✅ Full meter initialization and data polling functionality