import { validateInput } from "./security";

console.log("🛡️ Running Control Character Security Verification...");

let testCount = 0;
let passCount = 0;
let failCount = 0;

function runTest(name: string, input: string | null | undefined, shouldPass: boolean) {
    testCount++;
    try {
        validateInput(input, "TestInput");
        if (shouldPass) {
            console.log(`✅ [PASS] ${name}`);
            passCount++;
        } else {
            console.error(`❌ [FAIL] ${name}: Expected error but got success`);
            failCount++;
        }
    } catch (e: any) {
        if (!shouldPass) {
            // Check if error message is about control characters (once implemented)
            // For now, any error on expected fail is good, but we want specific error later
            console.log(`✅ [PASS] ${name}: Caught expected error -> ${e.message}`);
            passCount++;
        } else {
            console.error(`❌ [FAIL] ${name}: Unexpected error -> ${e.message}`);
            failCount++;
        }
    }
}

// Dangerous Control Characters (Should Fail)
runTest("Null Byte (\\x00)", "Hello\x00World", false);
runTest("Bell (\\x07)", "Ding\x07Dong", false);
runTest("Vertical Tab (\\x0B)", "Line1\x0BLine2", false);
runTest("Form Feed (\\x0C)", "Page1\x0CPage2", false);
runTest("Escape (\\x1B)", "Normal\x1B[31mRed", false);
runTest("Delete (\\x7F)", "Oops\x7F", false);

// Safe Control Characters (Should Pass)
runTest("Tab (\\t)", "Column1\tColumn2", true);
runTest("Line Feed (\\n)", "Line1\nLine2", true);
runTest("Carriage Return (\\r)", "Line1\rLine2", true);
runTest("CRLF (\\r\\n)", "Line1\r\nLine2", true);

// Edge Cases (Should Pass)
runTest("Null Input", null, true);
runTest("Undefined Input", undefined, true);
runTest("Empty String", "", true);
runTest("Normal Text", "Just some normal text with punctuation.", true);

console.log(`\n📊 Test Summary: ${passCount}/${testCount} passed.`);

if (failCount > 0) {
    console.error("💥 Verification Failed!");
    process.exit(1);
} else {
    console.log("🎉 Verification Successful!");
}
