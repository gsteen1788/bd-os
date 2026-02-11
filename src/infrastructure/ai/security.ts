// Security utilities for AI service

// Limit input length to prevent DoS attacks and excessive API costs
export const MAX_INPUT_LENGTH = 5000;

/**
 * Sanitizes input for use in XML/HTML prompts to prevent injection,
 * and enforces a maximum input length.
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return "";

    if (input.length > MAX_INPUT_LENGTH) {
        throw new Error(`Input too long for AI analysis (max ${MAX_INPUT_LENGTH} chars)`);
    }

    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
