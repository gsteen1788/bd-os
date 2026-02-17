import { sanitizeInput, validateInput, sanitizeError, MAX_INPUT_LENGTH } from "./security";

console.log("🛡️ Running Security Verification...");

// Test sanitizeInput
console.log("\n🧪 Testing sanitizeInput...");
const testCases = [
    { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
    { input: 'User & Company', expected: 'User &amp; Company' },
    { input: "O'Reilly", expected: "O&#039;Reilly" },
];

let sanitizePassed = true;
testCases.forEach(({ input, expected }) => {
    const result = sanitizeInput(input);
    if (result !== expected) {
        console.error(`❌ sanitizeInput failed for "${input}"\n  Expected: ${expected}\n  Got:      ${result}`);
        sanitizePassed = false;
    } else {
        console.log(`✅ sanitizeInput passed for "${input}"`);
    }
});

if (sanitizePassed) console.log("✅ All sanitizeInput tests passed.");

// Test validateInput
console.log("\n🧪 Testing validateInput...");
let validatePassed = true;

// Valid input
try {
    validateInput("This is a valid string", "Valid Test");
    console.log("✅ validateInput passed for valid input");
} catch (e) {
    console.error(`❌ validateInput threw unexpected error for valid input: ${e}`);
    validatePassed = false;
}

// Invalid input (too long)
const longString = "a".repeat(MAX_INPUT_LENGTH + 1);
try {
    validateInput(longString, "Long Test");
    console.error("❌ validateInput failed to throw for oversized input");
    validatePassed = false;
} catch (e: any) {
    if (e.message.includes("exceeds maximum allowed length")) {
        console.log("✅ validateInput correctly threw error for oversized input");
    } else {
        console.error(`❌ validateInput threw wrong error: ${e.message}`);
        validatePassed = false;
    }
}

if (validatePassed) console.log("✅ All validateInput tests passed.");

// Test sanitizeError
console.log("\n🧪 Testing sanitizeError...");
let sanitizeErrorPassed = true;

const errorTests = [
    { input: new Error("Safe Message"), expected: "Error: Safe Message" },
    { input: "String Error", expected: "String Error" },
    { input: { random: "object" }, expected: "An unexpected error occurred during AI processing." },
    { input: null, expected: "An unexpected error occurred during AI processing." }
];

errorTests.forEach(({ input, expected }, index) => {
    const result = sanitizeError(input);
    if (result !== expected) {
        console.error(`❌ sanitizeError failed for test case ${index}\n  Expected: ${expected}\n  Got:      ${result}`);
        sanitizeErrorPassed = false;
    } else {
        console.log(`✅ sanitizeError passed for test case ${index}`);
    }
});

if (sanitizeErrorPassed) console.log("✅ All sanitizeError tests passed.");

if (sanitizePassed && validatePassed && sanitizeErrorPassed) {
    console.log("\n🎉 Security Verification Successful!");
} else {
    console.error("\n💥 Security Verification Failed!");
    process.exit(1);
}
