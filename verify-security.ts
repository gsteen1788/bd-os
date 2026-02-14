import { validateInput, sanitizeInput, MAX_INPUT_LENGTH, SecurityError } from "./src/infrastructure/ai/security";
import fs from "fs";
import path from "path";

async function runVerification() {
    console.log("🛡️ Sentinel Security Verification Starting...\n");

    let allPassed = true;

    // 1. Verify validateInput logic
    console.log("1. Testing validateInput logic...");
    try {
        const shortInput = "A".repeat(10);
        validateInput(shortInput);
        console.log("   ✅ Short input passed validation.");

        const longInput = "A".repeat(MAX_INPUT_LENGTH + 1);
        try {
            validateInput(longInput);
            console.error("   ❌ Long input FAILED to throw SecurityError.");
            allPassed = false;
        } catch (e) {
            if (e instanceof SecurityError) {
                console.log("   ✅ Long input correctly threw SecurityError.");
            } else {
                console.error("   ❌ Long input threw unexpected error:", e);
                allPassed = false;
            }
        }
    } catch (e) {
        console.error("   ❌ validateInput test failed with error:", e);
        allPassed = false;
    }

    // 2. Verify sanitizeInput logic
    console.log("\n2. Testing sanitizeInput logic...");
    try {
        const unsafe = '<script>alert("XSS")</script> & \' "';
        const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; &#039; &quot;';
        const sanitized = sanitizeInput(unsafe);

        if (sanitized === expected) {
            console.log("   ✅ Input sanitized correctly.");
        } else {
            console.error(`   ❌ Input NOT sanitized correctly.\n      Expected: ${expected}\n      Got:      ${sanitized}`);
            allPassed = false;
        }
    } catch (e) {
        console.error("   ❌ sanitizeInput test failed with error:", e);
        allPassed = false;
    }

    // 3. Verify Integration (Static Analysis)
    console.log("\n3. Verifying integration in geminiService.ts...");
    const geminiServicePath = path.join(process.cwd(), "src/infrastructure/ai/geminiService.ts");
    try {
        const content = fs.readFileSync(geminiServicePath, "utf-8");

        const checks = [
            { pattern: /validateInput\(relationshipLevel\)/, name: "evaluateNextStep validation" },
            { pattern: /validateInput\(protemoiType\)/, name: "evaluateNextStep validation (2)" },
            { pattern: /validateInput\(nextStep\)/, name: "evaluateNextStep validation (3)" },
            { pattern: /validateInput\(stage\)/, name: "evaluateOpportunityNextStep validation" },
            { pattern: /validateInput\(mitText\)/, name: "evaluateMIT validation" },
            { pattern: /import.*validateInput.*from "\.\/security"/, name: "validateInput import" }
        ];

        checks.forEach(check => {
            if (check.pattern.test(content)) {
                console.log(`   ✅ Found: ${check.name}`);
            } else {
                console.error(`   ❌ Missing: ${check.name}`);
                allPassed = false;
            }
        });

    } catch (e) {
        console.error("   ❌ Failed to read geminiService.ts:", e);
        allPassed = false;
    }

    console.log("\n--------------------------------------------------");
    if (allPassed) {
        console.log("✅ VERIFICATION SUCCESSFUL: Security enhancements are correctly implemented.");
        process.exit(0);
    } else {
        console.error("❌ VERIFICATION FAILED: Issues found.");
        process.exit(1);
    }
}

runVerification();
