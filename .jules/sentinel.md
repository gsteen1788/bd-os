## 2024-05-30 - Information Disclosure via UI Error Boundaries
**Vulnerability:** Several UI components (`OpportunityBoard`, `ProtemoiBoard`, `MeetingPrep`) concatenated raw error objects (`e` or `String(e)`) into `alert()` dialogs when API or database operations failed.
**Learning:** Exposing raw error strings or objects directly to the end-user via UI boundaries (like `alert` or generic error toasts) can lead to Information Disclosure. It might leak sensitive database schema details, file paths, or backend logic that attackers could exploit.
**Prevention:** Always use generic, safe error messages (e.g., "Error saving opportunity.") for user-facing UI elements, while securely logging the actual detailed error object using `console.error` or the centralized `logger` utility for debugging purposes.

## 2024-05-30 - Information Disclosure via UI Error Boundaries
**Vulnerability:** Several UI components (`OpportunityBoard`, `ProtemoiBoard`, `MeetingPrep`) concatenated raw error objects (`e` or `String(e)`) into `alert()` dialogs when API or database operations failed.
**Learning:** Exposing raw error strings or objects directly to the end-user via UI boundaries (like `alert` or generic error toasts) can lead to Information Disclosure. It might leak sensitive database schema details, file paths, or backend logic that attackers could exploit.
**Prevention:** Always use generic, safe error messages (e.g., "Error saving opportunity.") for user-facing UI elements, while securely logging the actual detailed error object using `console.error` or the centralized `logger` utility for debugging purposes.
