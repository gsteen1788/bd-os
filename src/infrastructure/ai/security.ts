
/**
 * Maximum allowed length for AI input strings to prevent DoS attacks.
 */
export const MAX_INPUT_LENGTH = 5000;

/**
 * Maximum allowed length for large text content (e.g., notes, descriptions).
 */
export const MAX_TEXT_LENGTH = 50000;

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
 * @param maxLength Optional maximum length for the input (defaults to MAX_INPUT_LENGTH).
 */
export const validateInput = (input: string | null | undefined, fieldName: string = "Input", maxLength: number = MAX_INPUT_LENGTH): void => {
    if (!input) return;

    if (typeof input !== 'string') {
        throw new Error(`${fieldName} must be a string.`);
    }

    if (input.length > maxLength) {
        throw new Error(`${fieldName} exceeds maximum allowed length of ${maxLength} characters.`);
    }

    // Check for dangerous control characters (prevent injection attacks)
    // Allowed: \t (09), \n (0A), \r (0D)
    // Disallowed: 00-08, 0B-0C, 0E-1F, 7F
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
        throw new Error(`${fieldName} contains invalid control characters.`);
    }
};

/**
 * Validates that the provided string is a valid email format.
 * Allows null/undefined/empty string as valid (optional field).
 */
export const validateEmail = (email?: string | null): void => {
    if (!email) return;
    validateInput(email, "Email", MAX_INPUT_LENGTH);
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
    validateInput(url, "URL", MAX_INPUT_LENGTH);
    try {
        const u = new URL(url);
        if (!['http:', 'https:'].includes(u.protocol)) {
            throw new Error("URL must be http or https");
        }
    } catch {
        throw new Error("Invalid URL format");
    }
};

/**
 * Validates that the provided string is a safe URI (e.g. for image sources).
 * Rejects dangerous protocols like javascript: or data:
 * Allows http/https (via validateWebUrl) and assumes other strings might be local paths.
 */
export const validateSafeUri = (uri?: string | null): void => {
    if (!uri) return;
    validateInput(uri, "URI", MAX_INPUT_LENGTH);

    const trimmed = uri.trim();
    if (trimmed.length === 0) return;

    // Check for dangerous schemes at the start
    // We check for these specifically to block XSS vectors
    const dangerousSchemes = [
        /^javascript:/i,
        /^vbscript:/i,
        /^data:/i,
        /^file:/i  // Often restricted in web contexts, though Tauri might use custom protocols
    ];

    for (const scheme of dangerousSchemes) {
        if (scheme.test(trimmed)) {
            throw new Error("Dangerous URI scheme detected");
        }
    }

    // If it looks like a web URL, strictly validate it as such
    if (/^https?:\/\//i.test(trimmed)) {
        validateWebUrl(trimmed);
    }
};

/**
 * Validates that the provided input is a valid date string or Date object.
 * Prevents extremely long inputs and validates the parsed date.
 * Allows null/undefined as valid (optional field).
 */
export const validateDate = (date?: string | Date | null, fieldName: string = "Date"): void => {
    if (!date) return;

    if (typeof date === 'string') {
        // Prevent DoS from extremely long strings attempting to be parsed as dates
        if (date.length > 100) {
            throw new Error(`${fieldName} exceeds maximum length for a date string.`);
        }

        const timestamp = Date.parse(date);
        if (isNaN(timestamp)) {
            throw new Error(`Invalid date format for ${fieldName}`);
        }
    } else if (date instanceof Date) {
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid Date object for ${fieldName}`);
        }
    } else {
        throw new Error(`${fieldName} must be a valid date string or Date object`);
    }
};
