## 2026-02-10 - [React Render Loop Bottleneck]
**Learning:** `MitCard` component was performing O(N) array lookups for related entities (Opportunities, Relationships) inside its render loop, causing O(N*M) complexity where N=tasks, M=entities. This becomes a bottleneck with large datasets.
**Action:** Always pre-compute lookup Maps in parent components (using `useMemo`) and pass them down for O(1) access to prevent repetitive array scanning in render cycles.

## 2026-02-16 - [Large Entity Lists]
**Learning:** Loading full entity objects (with large text fields like `notesMd`, `careerHistory`) for list views causes unnecessary memory usage and slower query times.
**Action:** Implement `findAllSummaries()` in repositories to select only essential columns for list views. Crucially, ensure that edit actions fetch the full entity by ID (`findById`) before opening the editor to prevent accidental data loss (overwriting missing fields with null).

## 2026-03-20 - [Date Formatting Bottleneck]
**Learning:** `toLocaleDateString` and `toLocaleTimeString` are extremely slow in render loops because they instantiate `Intl.DateTimeFormat` on every call (~700ms for 1000 items).
**Action:** Always reuse `Intl.DateTimeFormat` instances (created at module scope or via `useMemo`) when formatting dates in loops or frequent renders. This yields ~100x performance improvement.
