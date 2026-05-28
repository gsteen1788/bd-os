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

## 2026-04-02 - Denial of Service via SQLite Variable Limit
**Vulnerability:** When a dynamic array of user-controlled or unbounded IDs was passed into a SQLite `IN ()` clause without chunking, the query crashed if the array length exceeded `SQLITE_MAX_VARIABLE_NUMBER` (usually 999).
**Learning:** Parameterized queries for dynamic lists protect against SQL injection but introduce a DoS vector if the host database limits the maximum number of bound variables per query.
**Prevention:** Always chunk dynamic arrays into smaller batches (e.g., 500) when passing them to an `IN` clause in SQLite to prevent database crashes.

## 2026-04-03 - Missing Validation for IDs and Search Queries
**Vulnerability:** Unbounded string inputs were accepted for entity IDs, foreign keys (like `organizationId`), and search queries in the repository layer.
**Learning:** While parameterized queries prevent SQL injection, they do not protect against memory exhaustion or application crashes caused by processing massive strings (DoS attacks). Security boundaries must validate length for *all* strings, including IDs and ad-hoc queries.
**Prevention:** Implement and enforce a `validateId` helper (wrapper around `validateInput` with a strict `maxLength`) for all entity IDs and foreign keys prior to database interactions. Apply length limits to `search(query)` inputs.

## 2025-02-12 - Missing Length Limits in Validation Functions
**Vulnerability:** Missing input length limits on validation functions (`validateEmail`, `validateWebUrl`, `validateSafeUri`).
**Learning:** Functions that rely on regex or object instantiation (like `new URL()`) are susceptible to DoS or ReDoS if arbitrarily long strings are provided. Furthermore, control characters (`\x00`) could be injected before URI schemes if `trim()` is used without prior validation.
**Prevention:** To prevent DoS attacks and bypasses, always call `validateInput` with a maximum length limit (e.g., `MAX_INPUT_LENGTH`) at the beginning of validation helpers before performing any regex tests or URI parsing.

## 2024-05-27 - Missing Validation for link.id in Nested Entity Properties
**Vulnerability:** The `SqliteTaskRepository.save` method iterated over `entity.links` to insert into `task_links`. While `link.entityType` and `link.entityId` were validated, `link.id` was pushed directly to the parameterized query placeholders without length limits.
**Learning:** Even when developers remember to validate nested properties like foreign keys, primary keys (`link.id`) of nested objects are often overlooked, especially if they are optional or auto-generated fallbacks (`link.id || crypto.randomUUID()`). This can allow excessively long strings to be passed as IDs via update requests, leading to DoS.
**Prevention:** When persisting entity relationships (e.g., iterating through `entity.links`), strictly ensure that every single string property of the nested objects, including the ID (`validateId(link.id, "Link ID")`), is validated before executing SQL queries.

## 2024-05-28 - Missing Fields in Opportunity Save Leading to Data Loss and DoS
**Vulnerability:** The `SqliteOpportunityRepository.save` method was completely missing the `expectedCloseDate` and `nextStepDueDate` fields in its `mapRow` function and in the `INSERT` and `ON CONFLICT DO UPDATE` SQL queries. Additionally, these fields were not being validated using `validateDate`.
**Learning:** Forgetting to map entity fields to database queries silently drops data. Not validating these missing date fields also leaves the system open to CPU-exhaustion DoS attacks via malicious, excessively long string parsing.
**Prevention:** Always verify that every property of a domain entity is mapped in the repository's SQL parameters and `mapRow` function. Additionally, enforce that all date fields use `validateDate` before being saved to the database to prevent ReDoS/CPU exhaustion attacks.

## 2026-06-09 - Stored XSS via Whitespace/Control Character Bypass in URI Validation
**Vulnerability:** The `validateSafeUri` function tested URIs against dangerous scheme regular expressions (e.g., `/^javascript:/i`) after only performing a basic `trim()`. Attackers could bypass this check by inserting spaces or control characters (like `\t`, `\n`) within the scheme name (e.g., `java\tscript:` or `j a v a s c r i p t:`), which browsers still interpret as valid URI schemes.
**Learning:** Regular expressions checking for URI schemes are insufficient if the input string is not properly normalized. Browsers are highly permissive and ignore whitespaces and certain non-printable characters when parsing URI schemes.
**Prevention:** Always normalize URI strings by aggressively stripping all whitespace (`\s`) and non-printable control characters (`\x00-\x1F\x7F`) before applying regular expression checks for dangerous schemes.

## 2026-06-10 - Secure Logger Implementation for PII Leakage
**Vulnerability:** Repositories were using raw `console.log` and `console.error` which risked dumping full entity objects containing PII into production logs.
**Learning:** PII leakage often happens via generic error logging (e.g., `catch(e) { console.error("Error", e) }`) where the full error object or context entity is logged.
**Prevention:** Use a centralized secure `logger.ts` utility that suppresses non-error logs in production (`import.meta.env.MODE`) and actively strips complex error objects (falling back to `error.message` or `String(error)`) to prevent unintended exposure of raw entity data.

## 2024-07-16 - Unvalidated Output from External AI Services
**Vulnerability:** Content generated from the Gemini AI service (`generateContent`) was inserted directly into the database without passing through `validateInput`.
**Learning:** Responses from external AI models should be treated as untrusted input. AI models can hallucinate or be manipulated to output extremely long strings, which could lead to DoS at the database level or schema constraint violations if ingested without length checks.
**Prevention:** Always pass the output of AI generations (like parsed JSON fields) through `validateInput` to enforce `MAX_TEXT_LENGTH` and control character constraints before persisting them to the database.
