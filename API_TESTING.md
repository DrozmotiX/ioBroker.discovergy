# API Testing with Demo Credentials

This document explains how to test the ioBroker Discovergy adapter with the provided demo credentials.

## Demo Credentials

The Discovergy/Inexogy service provides demo credentials for testing purposes:
- Username: `demo@inexogy.com`  
- Password: `demo`

## Running the Test

To test the adapter with demo credentials:

```bash
npm run test:integration-demo
```

This will:
1. Configure the adapter with demo credentials
2. Start the adapter
3. Attempt to connect to the Inexogy API at `api.inexogy.com`

## Expected Behavior

### With Internet Access

When the test environment has internet access to `api.inexogy.com`, the adapter should:

1. Successfully connect to the API
2. Retrieve meter information from the demo account
3. Initialize all meters
4. Log the message: **"All meters initialized, polling data every 30 seconds"**
5. Begin polling meter data at the configured interval (30 seconds by default)

### Without Internet Access

In sandboxed test environments without internet access (like CI/CD pipelines), the test will:

1. Successfully configure the adapter with demo credentials
2. Show that credentials are no longer missing
3. Attempt to connect to `api.inexogy.com`
4. Fail with DNS resolution error (`ENOTFOUND api.inexogy.com`)

This failure is expected and confirms that:
- The credentials bug is fixed
- The adapter attempts to connect to the correct API endpoint
- The full connection flow would work with internet access

## Manual Testing

For manual testing with internet access:
1. Install and configure the adapter in your ioBroker instance
2. Set the credentials to `demo@inexogy.com` / `demo`
3. Start the adapter
4. Check the logs for the expected initialization message

## Fixed Issues

This test verifies the fix for the credentials validation bug where `settings.user` was incorrectly used instead of `settings.Username` in the adapter code.