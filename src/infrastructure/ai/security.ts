
// Maximum input length to prevent DoS/token exhaustion
export const MAX_INPUT_LENGTH = 5000;

// Helper to sanitize input for XML/HTML context to prevent prompt injection
// and validate length.
export const sanitizeInput = (input: string): string => {
    if (!input) return "";

    if (input.length > MAX_INPUT_LENGTH) {
        throw new Error(`Input length ${input.length} exceeds maximum allowed length of ${MAX_INPUT_LENGTH}.`);
    }

    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
