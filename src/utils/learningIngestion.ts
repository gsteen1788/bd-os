import { generateContent } from "../infrastructure/ai/geminiService";
import { getDb } from "../infrastructure/db";
import { validateInput, MAX_TEXT_LENGTH } from "../infrastructure/ai/security";
import { logger } from "../infrastructure/logger";

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data url prefix (e.g. "data:image/png;base64,")
            const base64 = result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const PROMPT_TEXT = `
You are a business development expert. 
Analyze this document and extract a list of discrete, actionable learnings, tips, or insights related to business development, client relationships, or sales.
Return strictly a JSON array of strings. Do not include markdown formatting or correct the spelling of the original text if it's a quote, but ensure the learnings are clear and standalone.
Example format: ["Always follow up within 24 hours.", "Trust is built through consistency."]
`;

export async function ingestLearnings() {
    logger.info("Starting ingestion of learnings...");
    const db = await getDb();

    // Get all files from support directory
    // Note: Vite's import.meta.glob returns a map of functions that import the module
    // We use { query: '?url' } to get the URL to fetch
    const modules = import.meta.glob('../support/*', { query: '?url', eager: true });

    let count = 0;

    for (const path in modules) {
        // e.g. { default: "/src/support/file.png" }
        const mod = modules[path] as any;
        const fileUrl = mod.default as string;
        const fileName = path.split('/').pop() || "unknown";

        logger.info(`Processing ${fileName}...`);

        try {
            // Check if already ingested (optional optimization, skip for now to force update or add simple check)
            const existing = await db.select("SELECT id FROM learnings WHERE source_file = $1", [fileName]);
            if ((existing as any[]).length > 0) {
                logger.info(`Skipping ${fileName}, already ingested.`);
                continue;
            }

            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const base64Data = await blobToBase64(blob);
            const mimeType = blob.type;

            // Prepare parts for Gemini
            const parts = [
                { text: PROMPT_TEXT },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                }
            ];

            const result = await generateContent(parts as any); // Cast to any because our service signature is loose

            // Clean the result (remove markdown code blocks if any)
            let jsonString = result.trim();
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "");
            } else if (jsonString.startsWith("```")) {
                jsonString = jsonString.replace(/^```/, "").replace(/```$/, "");
            }

            const learnings = JSON.parse(jsonString) as string[];

            if (Array.isArray(learnings) && learnings.length > 0) {
                // Bulk insert optimization
                const chunkSize = 50;
                for (let i = 0; i < learnings.length; i += chunkSize) {
                    const chunk = learnings.slice(i, i + chunkSize);
                    const placeholders: string[] = [];
                    const values: any[] = [];
                    let validIndex = 0;

                    chunk.forEach((learning) => {
                        try {
                            validateInput(learning, "Learning Content", MAX_TEXT_LENGTH);
                            const offset = validIndex * 2;
                            placeholders.push(`($${offset + 1}, $${offset + 2})`);
                            values.push(learning, fileName);
                            validIndex++;
                        } catch (err) {
                            logger.warn(`Skipped invalid learning in ${fileName}:`, err);
                        }
                    });

                    if (placeholders.length > 0) {
                        const query = `INSERT INTO learnings (content, source_file) VALUES ${placeholders.join(", ")}`;
                        await db.execute(query, values);
                        count += validIndex;
                    }
                }
                logger.info(`Extracted ${learnings.length} learnings from ${fileName}.`);
            }

        } catch (error) {
            logger.error(`Error processing ${fileName}:`, error);
        }
    }

    logger.info(`Ingestion complete. Total new learnings: ${count}`);
    return count;
}
