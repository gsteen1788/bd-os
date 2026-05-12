export const logger = {
    info: (message: string, ...args: any[]) => {
        if (import.meta.env.MODE !== 'production') {
            console.log(`[INFO] ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: any[]) => {
        if (import.meta.env.MODE !== 'production') {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },
    error: (message: string, error?: any) => {
        // Strip out complex objects to prevent PII leakage
        if (error && error.message) {
            console.error(`[ERROR] ${message}`, error.message);
        } else if (error) {
            console.error(`[ERROR] ${message}`, String(error));
        } else {
            console.error(`[ERROR] ${message}`);
        }
    }
};
