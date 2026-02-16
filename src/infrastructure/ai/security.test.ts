import { sanitizeInput, validateInput, MAX_INPUT_LENGTH } from "./security";

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

if (sanitizePassed && validatePassed) {
    console.log("\n🎉 Security Verification Successful!");
} else {
    console.error("\n💥 Security Verification Failed!");
    process.exit(1);
}
