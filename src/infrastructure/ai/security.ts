export const MAX_INPUT_LENGTH = 5000;

export class SecurityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SecurityError";
    }
}

export const validateInput = (input: string): void => {
    if (!input) return;
    if (input.length > MAX_INPUT_LENGTH) {
        throw new SecurityError(`Input length exceeds maximum allowed limit of ${MAX_INPUT_LENGTH} characters.`);
    }
};

export const sanitizeInput = (input: string): string => {
    if (!input) return "";
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
