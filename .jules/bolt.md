## 2026-02-10 - [React Render Loop Bottleneck]
**Learning:** `MitCard` component was performing O(N) array lookups for related entities (Opportunities, Relationships) inside its render loop, causing O(N*M) complexity where N=tasks, M=entities. This becomes a bottleneck with large datasets.
**Action:** Always pre-compute lookup Maps in parent components (using `useMemo`) and pass them down for O(1) access to prevent repetitive array scanning in render cycles.

## 2026-02-12 - [Database Projection Optimization]
**Learning:** List views (`ProtemoiBoard`, `ContactList`) were fetching full `Contact` entities including large text fields (`notes_md`, `career_history`), causing unnecessary I/O and memory overhead.
**Action:** Implement `findAllSummaries()` in repositories to select only necessary columns for list views, and fetch full details lazily when needed (e.g., on edit click).
