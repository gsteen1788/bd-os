import { sanitizeInput, validateInput, MAX_INPUT_LENGTH, validateEmail, validateWebUrl } from "./security";

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

// Test validateEmail
console.log("\n🧪 Testing validateEmail...");
let emailPassed = true;

const emailTestCases = [
    { input: "user@example.com", valid: true },
    { input: "user.name@sub.domain.co.uk", valid: true },
    { input: null, valid: true },
    { input: undefined, valid: true },
    { input: "invalid-email", valid: false },
    { input: "user@domain", valid: false }, // Missing TLD
    { input: "@domain.com", valid: false },
];

emailTestCases.forEach(({ input, valid }) => {
    try {
        validateEmail(input);
        if (!valid) {
            console.error(`❌ validateEmail failed: accepted invalid email "${input}"`);
            emailPassed = false;
        } else {
            console.log(`✅ validateEmail passed for "${input}"`);
        }
    } catch (e) {
        if (valid) {
            console.error(`❌ validateEmail failed: rejected valid email "${input}"`);
            emailPassed = false;
        } else {
            console.log(`✅ validateEmail correctly rejected "${input}"`);
        }
    }
});
if (emailPassed) console.log("✅ All validateEmail tests passed.");


// Test validateWebUrl
console.log("\n🧪 Testing validateWebUrl...");
let urlPassed = true;

const urlTestCases = [
    { input: "https://example.com", valid: true },
    { input: "http://localhost:3000", valid: true },
    { input: null, valid: true },
    { input: undefined, valid: true },
    { input: "ftp://example.com", valid: false },
    { input: "javascript:alert(1)", valid: false },
    { input: "not-a-url", valid: false },
];

urlTestCases.forEach(({ input, valid }) => {
    try {
        validateWebUrl(input);
        if (!valid) {
            console.error(`❌ validateWebUrl failed: accepted invalid URL "${input}"`);
            urlPassed = false;
        } else {
            console.log(`✅ validateWebUrl passed for "${input}"`);
        }
    } catch (e) {
        if (valid) {
            console.error(`❌ validateWebUrl failed: rejected valid URL "${input}"`);
            urlPassed = false;
        } else {
            console.log(`✅ validateWebUrl correctly rejected "${input}"`);
        }
    }
});
if (urlPassed) console.log("✅ All validateWebUrl tests passed.");

if (sanitizePassed && validatePassed && emailPassed && urlPassed) {
    console.log("\n🎉 Security Verification Successful!");
} else {
    console.error("\n💥 Security Verification Failed!");
    process.exit(1);
}
