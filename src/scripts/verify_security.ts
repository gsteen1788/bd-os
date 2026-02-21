import { validateInput, MAX_INPUT_LENGTH, MAX_TEXT_LENGTH } from "../infrastructure/ai/security";

console.log("🛡️ Verifying Security Logic...");

let passed = 0;
let failed = 0;

function assertThrows(fn: () => void, testName: string) {
    try {
        fn();
        console.error(`❌ FAILED: ${testName} - Expected error but did not throw.`);
        failed++;
    } catch (e: any) {
        console.log(`✅ PASSED: ${testName} - Threw error as expected: ${e.message}`);
        passed++;
    }
}

function assertDoesNotThrow(fn: () => void, testName: string) {
    try {
        fn();
        console.log(`✅ PASSED: ${testName} - Did not throw.`);
        passed++;
    } catch (e: any) {
        console.error(`❌ FAILED: ${testName} - Unexpected error: ${e.message}`);
        failed++;
    }
}

// Test 1: Short input (default max)
assertDoesNotThrow(() => validateInput("short string"), "Short input (default max)");

// Test 2: Long input (default max)
const longString = "a".repeat(MAX_INPUT_LENGTH + 1);
assertThrows(() => validateInput(longString), "Long input (default max)");

// Test 3: Short input (large max)
assertDoesNotThrow(() => validateInput("short string", "Input", MAX_TEXT_LENGTH), "Short input (large max)");

// Test 4: Medium input (large max) - e.g. 10k chars
const mediumString = "a".repeat(10000);
assertDoesNotThrow(() => validateInput(mediumString, "Input", MAX_TEXT_LENGTH), "Medium input (large max)");

// Test 5: Very long input (large max)
const veryLongString = "a".repeat(MAX_TEXT_LENGTH + 1);
assertThrows(() => validateInput(veryLongString, "Input", MAX_TEXT_LENGTH), "Very long input (large max)");

// Test 6: Null input
assertDoesNotThrow(() => validateInput(null), "Null input");

// Test 7: Undefined input
assertDoesNotThrow(() => validateInput(undefined), "Undefined input");

console.log("\n---------------------------------------------------");
console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);

if (failed > 0) {
    process.exit(1);
}
