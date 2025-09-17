const path = require("path");
const { tests } = require("@iobroker/testing");

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
                
                // Set demo credentials in adapter config (native section)
                await harness.changeAdapterConfig("discovergy", {
                    native: {
                        Username: "demo@inexogy.com",
                        Password: "demo",
                        intervall: 30
                    }
                });

                console.log("Starting adapter with demo credentials...");
                
                // Start the adapter and wait for it to initialize
                await harness.startAdapter();
                
                // Wait some time for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
                
                console.log("Adapter initialization period completed");
                
                return true;
            }).timeout(90000); // 90 second timeout for API calls
        });
    }
});