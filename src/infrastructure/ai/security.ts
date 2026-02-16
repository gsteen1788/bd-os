
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
