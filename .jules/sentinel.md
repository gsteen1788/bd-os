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

## 2026-02-14 - Centralized AI Input Validation
**Vulnerability:** AI input validation logic (sanitization) was scattered and duplicated, and lacked length limits (DoS risk).
**Learning:** GenAI prompts are constructed from user input and can be massive. Without centralized validation, it's easy to miss checks or have inconsistent rules across different prompt templates.
**Prevention:** Always use a dedicated security module for input validation and sanitization, especially for AI services where prompt injection is a risk.
