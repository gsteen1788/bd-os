import { sanitizeInput, validateInput, MAX_INPUT_LENGTH, MAX_TEXT_LENGTH, validateEmail, validateWebUrl, validateSafeUri, validateDate } from "./security";

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

// Invalid input (too long - default limit)
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

// Test validateInput with custom length
console.log("\n🧪 Testing validateInput with custom length...");
try {
    validateInput("abc", "Short", 5);
    console.log("✅ validateInput passed for input within custom limit");
} catch (e) {
    console.error(`❌ validateInput threw unexpected error for valid input within custom limit: ${e}`);
    validatePassed = false;
}

try {
    validateInput("abcdef", "Short", 5);
    console.error("❌ validateInput failed to throw for input exceeding custom limit");
    validatePassed = false;
} catch (e: any) {
    if (e.message.includes("exceeds maximum allowed length")) {
        console.log("✅ validateInput correctly threw error for input exceeding custom limit");
    } else {
        console.error(`❌ validateInput threw wrong error: ${e.message}`);
        validatePassed = false;
    }
}

// Test MAX_TEXT_LENGTH
const longText = "a".repeat(MAX_TEXT_LENGTH + 1);
try {
    validateInput(longText, "Large Text", MAX_TEXT_LENGTH);
    console.error("❌ validateInput failed to throw for MAX_TEXT_LENGTH exceeded");
    validatePassed = false;
} catch (e: any) {
    console.log("✅ validateInput correctly threw error for MAX_TEXT_LENGTH exceeded");
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


// Test validateSafeUri
console.log("\n🧪 Testing validateSafeUri...");
let safeUriPassed = true;

const safeUriTestCases = [
    { input: "https://example.com/image.png", valid: true },
    { input: "http://localhost:3000/logo.svg", valid: true },
    { input: "/local/path/to/image.jpg", valid: true },
    { input: "assets/logo.png", valid: true },
    { input: null, valid: true },
    { input: undefined, valid: true },
    { input: "", valid: true },
    { input: "javascript:alert(1)", valid: false },
    { input: "vbscript:msgbox('hello')", valid: false },
    { input: "data:text/html,<script>alert(1)</script>", valid: false },
    { input: "file:///etc/passwd", valid: false },
    { input: "java\tscript:alert(1)", valid: false }, // Control character bypass
    { input: "javascript :alert(1)", valid: false }, // Space bypass
    { input: "j a v a s c r i p t:alert(1)", valid: false }, // Dispersed spaces bypass
    { input: "java\nscript:alert(1)", valid: false }, // Newline bypass
    { input: "java\rscript:alert(1)", valid: false }, // Carriage return bypass
];

safeUriTestCases.forEach(({ input, valid }) => {
    try {
        validateSafeUri(input);
        if (!valid) {
            console.error(`❌ validateSafeUri failed: accepted invalid URI "${input}"`);
            safeUriPassed = false;
        } else {
            console.log(`✅ validateSafeUri passed for "${input}"`);
        }
    } catch (e) {
        if (valid) {
            console.error(`❌ validateSafeUri failed: rejected valid URI "${input}"`);
            safeUriPassed = false;
        } else {
            console.log(`✅ validateSafeUri correctly rejected "${input}"`);
        }
    }
});
if (safeUriPassed) console.log("✅ All validateSafeUri tests passed.");

// Test validateDate
console.log("\n🧪 Testing validateDate...");
let datePassed = true;

const dateTestCases = [
    { input: "2023-10-01T12:00:00Z", valid: true },
    { input: new Date(), valid: true },
    { input: null, valid: true },
    { input: undefined, valid: true },
    { input: "", valid: true },
    { input: "not-a-date", valid: false },
    { input: "a".repeat(101), valid: false }, // exceed max length
    { input: new Date("invalid"), valid: false },
    { input: 1234567890 as any, valid: false }, // Invalid type
];

dateTestCases.forEach(({ input, valid }) => {
    try {
        validateDate(input);
        if (!valid) {
            console.error(`❌ validateDate failed: accepted invalid date`);
            datePassed = false;
        } else {
            console.log(`✅ validateDate passed for valid input`);
        }
    } catch (e) {
        if (valid) {
            console.error(`❌ validateDate failed: rejected valid date`);
            datePassed = false;
        } else {
            console.log(`✅ validateDate correctly rejected invalid input`);
        }
    }
});

if (datePassed) console.log("✅ All validateDate tests passed.");


if (sanitizePassed && validatePassed && emailPassed && urlPassed && safeUriPassed && datePassed) {
    console.log("\n🎉 Security Verification Successful!");
} else {
    console.error("\n💥 Security Verification Failed!");
    process.exit(1);
}
