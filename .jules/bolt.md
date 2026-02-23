## 2026-02-10 - [React Render Loop Bottleneck]
**Learning:** `MitCard` component was performing O(N) array lookups for related entities (Opportunities, Relationships) inside its render loop, causing O(N*M) complexity where N=tasks, M=entities. This becomes a bottleneck with large datasets.
**Action:** Always pre-compute lookup Maps in parent components (using `useMemo`) and pass them down for O(1) access to prevent repetitive array scanning in render cycles.

## 2026-02-16 - [Large Entity Lists]
**Learning:** Loading full entity objects (with large text fields like `notesMd`, `careerHistory`) for list views causes unnecessary memory usage and slower query times.
**Action:** Implement `findAllSummaries()` in repositories to select only essential columns for list views. Crucially, ensure that edit actions fetch the full entity by ID (`findById`) before opening the editor to prevent accidental data loss (overwriting missing fields with null).

## 2025-02-18 - [Optimizing List Views with Summaries]
**Learning:** When optimizing list views by fetching only summary data (e.g.,  excluding large text fields), always verify the **edit/save** flow.
If the UI uses the summary object to populate an edit form, saving it back might overwrite the missing fields (like ) with  or .
**Action:** Always fetch the full entity by ID before applying updates in the save handler, or ensure the backend  method performs a partial update (which  repositories here do NOT support; they do full UPSERT).

## 2025-02-18 - [Optimizing List Views with Summaries]
**Learning:** When optimizing list views by fetching only summary data (e.g., `findAllSummaries` excluding large text fields), always verify the **edit/save** flow.
If the UI uses the summary object to populate an edit form, saving it back might overwrite the missing fields (like `notesMd`) with `null` or `undefined`.
**Action:** Always fetch the full entity by ID before applying updates in the save handler, or ensure the backend `save` method performs a partial update (which `tauri-sql` repositories here do NOT support; they do full UPSERT).

## 2025-02-24 - [Base Repository Mapping Bug]
**Learning:** The abstract `SqliteRepository` implementation of `findById` was returning raw database rows (snake_case) instead of mapped entities (camelCase), causing silent failures or missing data in the UI for any component relying on `findById`.
**Action:** Refactored `SqliteRepository` to enforce `protected abstract mapRow(row: any): T;` and updated `findById` to use it. When extending base repositories, always verify that generic methods (like `findById`) properly use the mapping logic defined in subclasses.
