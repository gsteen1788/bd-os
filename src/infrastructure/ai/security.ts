export const MAX_INPUT_LENGTH = 5000;

/**
 * Sanitizes input for use in XML/HTML contexts to prevent prompt injection.
 * Replaces special characters with HTML entities.
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
 * Validates that the input length does not exceed the maximum allowed length.
 * Throws an error if the input is too long.
 * @param input The input string to validate.
 * @param context A description of the input field (for error messages).
 */
export const validateInput = (input: string, context: string = "Input"): void => {
    if (input && input.length > MAX_INPUT_LENGTH) {
        throw new Error(`${context} exceeds maximum length of ${MAX_INPUT_LENGTH} characters.`);
    }
};
