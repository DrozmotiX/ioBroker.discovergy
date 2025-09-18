const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    // Read the system.config object to get the secret
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    
    // Apply ioBroker's encryption logic
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials from Discovergy/Inexogy
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        // Test with the demo credentials to ensure API connection works
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize meters with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                // Make sure adapter is not running first
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                // Encrypt the password using ioBroker's encryption method
                const encryptedPassword = await encryptPassword(harness, "demo");
                console.log("Password encrypted successfully");
                
                // Set demo credentials in adapter config (native section)
                // Use demo@inexogy.com as specified in the issue with encrypted password
                await harness.changeAdapterConfig("discovergy", {
                    native: {
                        Username: "demo@inexogy.com",
                        Password: encryptedPassword, 
                        intervall: 30
                    }
                });

                console.log("Starting adapter with demo credentials (demo@inexogy.com)...");
                
                // Start the adapter and wait for it to initialize
                await harness.startAdapter();
                
                // Wait for API calls and meter initialization
                // The adapter should connect to api.inexogy.com and retrieve meter data
                await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds for full initialization
                
                // Check if the connection state was set to true, indicating successful API connection
                const connectionState = await harness.states.getStateAsync("discovergy.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established, meters should be initialized");
                    console.log("Expected log message: 'All meters initialized, polling data every 30 seconds'");
                    return true;
                } else {
                    console.log("❌ FAIL: API connection was not established");
                    console.log("Connection state:", connectionState);
                    
                    // The test should now work properly with encrypted password
                    // If it still fails, it's likely due to invalid demo credentials or network issues
                    throw new Error("Test failed: Expected API connection to be established with demo credentials. " +
                        "The adapter should log 'All meters initialized, polling data every 30 seconds' on successful connection.");
                }
            }).timeout(120000); // 2 minutes timeout for API calls
        });
    }
});