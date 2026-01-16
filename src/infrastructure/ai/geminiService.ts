import { GoogleGenerativeAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

if (!apiKey) {
    console.warn("VITE_GOOGLE_API_KEY is not set in environment variables.");
}

// Initialize the client.
// Note: Depending on the specific version of @google/genai and its API surface, 
// initialization might vary. This assumes a standard pattern or one close to it.
// We will refine this if the build fails or if the SDK has a different signature.
// Based on typical Google Cloud client libraries, it might need a project ID or location too,
// but usually the API key is sufficient for the Generative AI specific client.

// However, the search result 1 mentioned "The @google/genai package... usage example...".
// Common pattern for new Google GenAI SDKs is often:
// const genAI = new GoogleGenerativeAI(apiKey);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Let's implement that pattern.

let genAI: GoogleGenerativeAI | null = null;

export const getGeminiClient = () => {
    if (!genAI && apiKey) {
        try {
            genAI = new GoogleGenerativeAI(apiKey);
        } catch (error) {
            console.error("Failed to initialize Gemini client:", error);
        }
    }
    return genAI;
};

export const generateContent = async (prompt: string, modelName: string = "gemini-1.5-flash") => {
    const client = getGeminiClient();
    if (!client) {
        throw new Error("Gemini client not initialized. Check API key.");
    }

    try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
};
