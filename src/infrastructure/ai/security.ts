// AI Security: Input Validation and Sanitization

// Maximum input length to prevent DoS attacks and excessive token usage
export const MAX_INPUT_LENGTH = 5000;

// Helper to sanitize input for XML/HTML context to prevent prompt injection
export const sanitizeInput = (input: string): string => {
    if (!input) return "";
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Validates and sanitizes input for AI prompts.
 * 1. Truncates input to MAX_INPUT_LENGTH.
 * 2. Escapes XML special characters.
 */
export const validateAndSanitizeInput = (input: string): string => {
    if (!input) return "";

    let sanitized = input;

    // Check length and truncate if necessary
    if (sanitized.length > MAX_INPUT_LENGTH) {
        console.warn(`Input truncated: exceeded ${MAX_INPUT_LENGTH} characters.`);
        sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    }

    return sanitizeInput(sanitized);
};
