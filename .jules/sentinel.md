## 2024-05-22 - CSP Disabled by Default
**Vulnerability:** Content Security Policy (CSP) was explicitly set to `null` in `tauri.conf.json`.
**Learning:** Initial configurations or templates might disable CSP for development convenience, leaving the application vulnerable to XSS and data exfiltration.
**Prevention:** Always enforce a strict CSP in `tauri.conf.json`, using `'unsafe-inline'` only if strictly necessary and scoping `connect-src` to known endpoints.
