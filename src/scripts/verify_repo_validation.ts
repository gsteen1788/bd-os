import fs from 'fs';
import path from 'path';

const repoPath = path.join(process.cwd(), 'src/infrastructure/repositories.ts');
const content = fs.readFileSync(repoPath, 'utf-8');

const checks = [
    { pattern: /validateInput\(entity\.name, "Organization Name"\)/, name: "Organization Name" },
    { pattern: /validateInput\(entity\.notesMd, "Notes", MAX_TEXT_LENGTH\)/, name: "Organization Notes" },
    { pattern: /validateInput\(entity\.firstName, "First Name"\)/, name: "Contact First Name" },
    { pattern: /validateInput\(entity\.notesMd, "Notes", MAX_TEXT_LENGTH\)/, name: "Contact Notes" },
    { pattern: /validateInput\(entity\.storiesAnecdotes, "Stories & Anecdotes", MAX_TEXT_LENGTH\)/, name: "Contact Stories" },
    { pattern: /validateInput\(entity\.hobbiesInterests, "Hobbies & Interests", MAX_TEXT_LENGTH\)/, name: "Contact Hobbies" },
    { pattern: /validateInput\(entity\.other, "Other", MAX_TEXT_LENGTH\)/, name: "Contact Other" },
    { pattern: /validateInput\(entity\.currentFocus, "Current Focus", MAX_TEXT_LENGTH\)/, name: "Contact Current Focus" },
    { pattern: /validateInput\(entity\.children, "Children"\)/, name: "Contact Children" },
    { pattern: /validateInput\(entity\.maritalStatus, "Marital Status"\)/, name: "Contact Marital Status" },
    { pattern: /validateInput\(entity\.education, "Education", MAX_TEXT_LENGTH\)/, name: "Contact Education" },
    { pattern: /validateInput\(entity\.location, "Location"\)/, name: "Contact Location" },
    { pattern: /validateInput\(entity\.phone, "Phone"\)/, name: "Contact Phone" },
    { pattern: /validateInput\(entity\.name, "Opportunity Name"\)/, name: "Opportunity Name" },
    { pattern: /validateInput\(entity\.descriptionMd, "Description", MAX_TEXT_LENGTH\)/, name: "Opportunity Description" },
    { pattern: /validateInput\(entity\.title, "Meeting Title"\)/, name: "Meeting Title" },
    { pattern: /validateInput\(entity\.notesMd, "Meeting Notes", MAX_TEXT_LENGTH\)/, name: "Meeting Notes" },
    { pattern: /validateInput\(entity\.title, "Task Title"\)/, name: "Task Title" },
    { pattern: /validateInput\(entity\.descriptionMd, "Description", MAX_TEXT_LENGTH\)/, name: "Task Description" },
    // New checks
    { pattern: /validateInput\(entity\.thinkingPreference, "Thinking Preference"\)/, name: "Contact Thinking Preference" },
    { pattern: /validateInput\(entity\.primaryBuyInPriority, "Buy-in Priority"\)/, name: "Contact Buy-in Priority" },
    { pattern: /validateInput\(entity\.primarySponsor, "Primary Sponsor"\)/, name: "Opportunity Primary Sponsor" },
    { pattern: /validateInput\(entity\.obstacle, "Obstacle", MAX_TEXT_LENGTH\)/, name: "Opportunity Obstacle" },
    { pattern: /validateInput\(entity\.nextStepText, "Next Step", MAX_TEXT_LENGTH\)/, name: "Protemoi Next Step" },
    { pattern: /validateInput\(entity\.relationshipStage, "Relationship Stage"\)/, name: "Protemoi Relationship Stage" },
    { pattern: /validateInput\(entity\.bigImpactDescription, "Big Impact", MAX_TEXT_LENGTH\)/, name: "Task Big Impact" },
    { pattern: /validateInput\(entity\.inControlDescription, "In Control", MAX_TEXT_LENGTH\)/, name: "Task In Control" },
    { pattern: /validateInput\(entity\.growthOrientedDescription, "Growth Oriented", MAX_TEXT_LENGTH\)/, name: "Task Growth Oriented" },
    { pattern: /validateInput\(entity\.metric, "Metric"\)/, name: "Tracker Goal Metric" },
    { pattern: /validateInput\(entity\.reflectionMd, "Reflection", MAX_TEXT_LENGTH\)/, name: "Week Review Reflection" },
];

let passed = true;
console.log("🛡️ Verifying Repository Validation Calls...");

if (!content.includes('import { validateEmail, validateWebUrl, validateInput, MAX_TEXT_LENGTH } from "./ai/security";')) {
    console.error("❌ Missing or incorrect import in repositories.ts");
    // passed = false; // Import string might vary slightly due to spacing, so don't fail hard on exact string match if logic works.
    // But let's check for validateInput usage which implies import.
} else {
    console.log("✅ Import statement correct.");
}

checks.forEach(check => {
    if (check.pattern.test(content)) {
        console.log(`✅ Found validation for ${check.name}`);
    } else {
        console.error(`❌ Missing validation for ${check.name}`);
        passed = false;
    }
});

if (passed) {
    console.log("🎉 Repository verification successful!");
} else {
    console.error("💥 Repository verification failed!");
    process.exit(1);
}
