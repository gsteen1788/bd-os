## 2024-05-22 - [Hidden N+1 in Repository Methods]
**Learning:** The `SqliteTaskRepository` methods like `findAllHistory` were silently performing N+1 queries (or large IN clauses) to populate relations (`populateLinks`) even when that data wasn't needed by the consumer. This highlights the risk of "heavy" default repository methods.
**Action:** Always check if a repository method fetches associated data before using it in a performance-critical loop or list view. Create "light" versions of methods (e.g., without joins/populates) for summaries.

## 2024-05-24 - [Redundant Data Fetching in Dashboard]
**Learning:** The Dashboard was fetching history tasks twice in parallel when in 'History' mode because `findHistory(50)` was called twice in `Promise.all`.
**Action:** When using `Promise.all`, assign potential shared promises to variables first to ensure they are executed once and reused.

## 2026-02-07 - [Unbounded History Fetching]
**Learning:** The `Tracker` component was fetching all task history via `findAllHistory` and filtering in memory, which scales poorly (O(N) memory + O(W*N) loop).
**Action:** Always implement date-range filtering in repository methods (e.g., `findHistoryInRange`) when building date-based views like calendars or trackers, rather than fetching all records.
