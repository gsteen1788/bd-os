## 2024-05-22 - CSP Disabled by Default
**Vulnerability:** Content Security Policy (CSP) was explicitly set to `null` in `tauri.conf.json`.
**Learning:** Initial configurations or templates might disable CSP for development convenience, leaving the application vulnerable to XSS and data exfiltration.
**Prevention:** Always enforce a strict CSP in `tauri.conf.json`, using `'unsafe-inline'` only if strictly necessary and scoping `connect-src` to known endpoints.

## 2026-02-06 - Exposed Sensitive Data in Logs
**Vulnerability:** Full entity objects (Contact, Meeting Notes, Opportunities) containing PII and business-sensitive data were being logged to the console using `console.log`.
**Learning:** Developers often leave debug logs that dump entire objects, unaware that in production or shared environments, these logs can leak sensitive data.
**Prevention:** Use a logger that scrubs sensitive data or enforces a rule to only log IDs or safe summaries of entities. Review `console.log` usage during code reviews.

## 2026-03-03 - SQL Injection in Dynamic Query Construction
**Vulnerability:** A SQL injection vulnerability was found in `SqliteTaskRepository.populateLinks` where task IDs were directly interpolated into the SQL query string using `task_id IN (${taskIds})`.
**Learning:** Even when using typed IDs (like UUIDs), relying on string interpolation for dynamic lists (e.g., `IN` clauses) bypasses parameterization and creates injection risks.
**Prevention:** Always use parameterized queries (`$1`, `$2`, etc.) even for dynamic lists by generating the placeholders programmatically and passing the values array separately.

## 2026-02-10 - Prompt Injection in AI Services
**Vulnerability:** User inputs (e.g., meeting notes, next steps) were interpolated directly into the prompt string without sanitization or delimitation, allowing potential prompt injection attacks.
**Learning:** LLMs can be manipulated by malicious instructions embedded in input data if the prompt doesn't clearly distinguish between "instructions" and "data".
**Prevention:** Use XML-like tags (e.g., `<input>`) to wrap user data, sanitize the input to escape those tags, and explicitly instruct the model to treat the content within tags as data only.

## 2026-06-01 - Insecure Token Storage
**Vulnerability:** OAuth access and refresh tokens were being stored in `localStorage` in `src/services/authService.ts`.
**Learning:** `localStorage` is vulnerable to XSS attacks, allowing malicious scripts to steal sensitive tokens.
**Prevention:** Use secure storage mechanisms like `tauri-plugin-store` (persisted to file) or `sessionStorage` (cleared on close) for sensitive data, and minimize XSS surface area.

## 2026-06-01 - Missing Input Validation in Repositories
**Vulnerability:** Repositories were persisting user input (emails, URLs) without validation, allowing invalid data formats and potential injection vectors (e.g., `javascript:` URLs).
**Learning:** Relying solely on frontend validation is insufficient as it can be bypassed. Backend/Repository layer must enforce data integrity and security constraints.
**Prevention:** Implement strict input validation (e.g., regex for email, protocol check for URLs) in the repository `save` methods before executing database queries.

## 2026-06-02 - Missing Input Length Validation (DoS Risk)
**Vulnerability:** Repositories allowed unlimited string length for text fields (e.g., `notesMd`, `descriptionMd`), enabling potential Denial of Service (DoS) attacks via memory exhaustion or database bloat.
**Learning:** Default validation often overlooks maximum length constraints, assuming "reasonable" user behavior. Attackers can exploit this by sending massive payloads.
**Prevention:** Enforce strict maximum length limits (e.g., 50k chars for large text) in the repository layer using `validateInput` with a `maxLength` parameter before database insertion.

## 2026-02-24 - Inconsistent Validation Coverage in Contact Repository
**Vulnerability:** While major fields like `notesMd` were validated, several secondary fields in `Contact` (`other`, `currentFocus`, `children`, etc.) were completely unvalidated, leaving gaps for DoS attacks.
**Learning:** Partial security implementation is common; developers often secure the "obvious" fields but forget the less prominent ones. Automated verification scripts must be comprehensive.
**Prevention:** Audit all entity fields against the repository implementation and ensure the verification script checks for *every* string field, not just a sample.

## 2026-06-03 - Missing Control Character Validation
**Vulnerability:** Input fields accepted dangerous control characters (e.g., \x00, \x1F), which could lead to injection attacks or data corruption in downstream systems (AI, Database).
**Learning:** Standard string validation often overlooks invisible control characters. Documentation might claim validation exists when it doesn't.
**Prevention:** Explicitly validate against a blacklist of control characters (allowing only safe ones like Tab, CR, LF) in the central input validation utility.

## 2026-06-05 - Inadequate URI Validation (Stored XSS)
**Vulnerability:** The `Organization.logoUrl` field was validated only by checking if it started with "http", which allowed malicious schemes like `javascript:alert(1)` to bypass validation and be stored.
**Learning:** Ad-hoc or "good enough" string checks (like `startsWith`) are often insufficient for security. XSS vectors are creative and can utilize many protocols.
**Prevention:** Use a dedicated validation function (e.g., `validateSafeUri`) that explicitly blocks known dangerous schemes (javascript, data, vbscript) before allowing file paths or URLs.
## 2024-05-24 - [Repository save methods missing validations]
**Vulnerability:** Several domain entity fields (e.g., `status`, `stage`, `type`, `tag`, `linkedEntityType`) were not being passed through the centralized `validateInput` utility in their respective `save` methods within `src/infrastructure/repositories.ts` prior to insertion into the SQLite database.
**Learning:** This exposes the database to potential DoS attacks (via extremely long inputs exceeding memory or schema constraints) and allows potentially malicious control characters to be persisted into the database if the input wasn't strictly vetted elsewhere.
**Prevention:** Always ensure that every string field of a domain entity, regardless of whether it represents an Enum-like value or a relationship type, is validated using `validateInput` in repository `save` methods to guarantee length limits and sanitize control characters at the persistence boundary.
## 2026-06-06 - Missing Test Coverage for Stored XSS Mitigation (validateSafeUri)
**Vulnerability:** The central security utility `validateSafeUri` (designed to prevent Stored XSS via malicious schemes like `javascript:`) lacked automated test coverage in `src/infrastructure/ai/security.test.ts`.
**Learning:** Security functions that lack test coverage are vulnerable to regressions. If `validateSafeUri` were accidentally modified or bypassed in the future, the lack of tests would silently allow XSS vulnerabilities back into the application (e.g., via `Organization.logoUrl`).
**Prevention:** Ensure that every security utility function exported from `security.ts` (especially those mitigating specific attack vectors like XSS) has dedicated and comprehensive unit tests.
## 2024-05-25 - HTML Injection via External APIs
**Vulnerability:** External APIs like Microsoft Graph allow specifying the `contentType` of an event body (e.g., `HTML`). If user input is passed into the `content` field without sanitization, it can lead to Stored XSS in the downstream system (e.g., the user's Outlook Calendar).
**Learning:** Security boundaries extend beyond our application's immediate UI. Data sent to integrated third-party systems that render HTML must be sanitized before transmission, or the application acts as a confused deputy facilitating attacks on the user's other tools.
**Prevention:** Always sanitize user input (e.g., using `sanitizeInput` to escape HTML entities) before embedding it into HTML-content fields of external API payloads, unless a specific, secure Markdown-to-HTML pipeline is used.
## 2024-05-26 - [DoS via Date Parsing]
**Vulnerability:** Date strings parsed directly without maximum length checks can be exploited for DoS (Denial of Service) attacks through ReDoS or CPU-exhaustion in the JS date parser. Moreover, the generic `validateInput` utility, designed for strings, fails or crashes when applied to valid Date objects.
**Learning:** Generic string validation utilities should strictly enforce types or gracefully handle non-strings. For dates, a dedicated validation function must be used to enforce length limits before parsing, and gracefully handle `Date` objects vs strings.
**Prevention:** Implement and use a dedicated `validateDate` utility that limits string length (e.g., max 100 characters) before passing to `Date.parse`, and validates `Date` object integrity via `isNaN(date.getTime())`.
## 2026-06-08 - Missing Validation for Nested Entity Properties
**Vulnerability:** The `SqliteTaskRepository.save` method iterated over `entity.links` to insert into `task_links`, but only validated the `link.entityType` property using `validateInput`. The `link.entityId` property was passed directly to the query placeholders without validation, potentially allowing malformed or overly long strings.
**Learning:** Developers often validate top-level fields of an entity but forget to apply the same strict validation utility (`validateInput`) to properties of nested objects or arrays (like relationships) before they reach the persistence layer.
**Prevention:** When persisting entity relationships (e.g., iterating through `entity.links`), strictly ensure that every single string property of the nested objects (both `entityType` and `entityId`) is validated with `validateInput` before executing the SQL queries to prevent string injection or DoS via maliciously crafted array items.
