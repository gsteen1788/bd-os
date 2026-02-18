
/**
 * Maximum allowed length for AI input strings to prevent DoS attacks.
 */
export const MAX_INPUT_LENGTH = 5000;

/**
 * Sanitizes input for XML/HTML context to prevent prompt injection.
 * Escapes: & < > " '
 */
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
 * Validates the input string against security constraints.
 * Throws an error if validation fails.
 *
 * @param input The input string to validate.
 * @param fieldName Optional name of the field for error reporting.
 */
export const validateInput = (input: string, fieldName: string = "Input"): void => {
    if (!input) return;

    if (input.length > MAX_INPUT_LENGTH) {
        throw new Error(`${fieldName} exceeds maximum allowed length of ${MAX_INPUT_LENGTH} characters.`);
    }
};

/**
 * Validates that the provided string is a valid email format.
 * Allows null/undefined/empty string as valid (optional field).
 */
export const validateEmail = (email?: string | null): void => {
    if (!email) return;
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
    }
};

/**
 * Validates that the provided string is a valid web URL (http/https).
 * Allows null/undefined/empty string as valid (optional field).
 */
export const validateWebUrl = (url?: string | null): void => {
    if (!url) return;
    try {
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) {
            throw new Error("URL must be http or https");
        }
    } catch {
        throw new Error("Invalid URL format");
    }
};
