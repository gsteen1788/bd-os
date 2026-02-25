import { validateInput } from './security';

console.log("🛡️ Running Control Character Security Tests...");

let testsPassed = true;

const invalidInputs = [
    { input: "Hello\x00World", description: "Null byte" },
    { input: "Hello\x1BWorld", description: "Escape character" },
    { input: "Hello\x07World", description: "Bell character" },
    { input: "Hello\x1FWorld", description: "Unit Separator" },
    { input: "Hello\x7FWorld", description: "Delete character" },
];

const validInputs = [
    { input: "Hello\nWorld", description: "Newline" },
    { input: "Hello\tWorld", description: "Tab" },
    { input: "Hello\r\nWorld", description: "CRLF" },
    { input: "Hello World", description: "Normal text" },
    { input: "👍 Emoji", description: "Emoji" },
];

// Verify INVALID inputs throw error
invalidInputs.forEach(({ input, description }) => {
    try {
        validateInput(input, "TestField");
        console.error(`❌ validateInput failed to reject: ${description} (Should have thrown error)`);
        testsPassed = false;
    } catch (e: any) {
        if (e.message.includes("contains invalid control characters")) {
            console.log(`✅ validateInput correctly rejected: ${description}`);
        } else if (e.message.includes("exceeds maximum allowed length")) {
            console.error(`❌ validateInput threw wrong error for: ${description} (Got length error)`);
            testsPassed = false;
        } else {
            console.error(`❌ validateInput threw unexpected error for: ${description} (${e.message})`);
            testsPassed = false; // Currently will fail because validateInput doesn't throw at all for control chars
        }
    }
});

// Verify VALID inputs pass
validInputs.forEach(({ input, description }) => {
    try {
        validateInput(input, "TestField");
        console.log(`✅ validateInput accepted: ${description}`);
    } catch (e: any) {
        console.error(`❌ validateInput incorrectly rejected: ${description} (${e.message})`);
        testsPassed = false;
    }
});

if (testsPassed) {
    console.log("\n🎉 All Control Character Tests Passed!");
} else {
    console.error("\n💥 Some Control Character Tests Failed!");
    process.exit(1);
}
