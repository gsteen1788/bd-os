## 2024-05-22 - [Hidden N+1 in Repository Methods]
**Learning:** The `SqliteTaskRepository` methods like `findAllHistory` were silently performing N+1 queries (or large IN clauses) to populate relations (`populateLinks`) even when that data wasn't needed by the consumer. This highlights the risk of "heavy" default repository methods.
**Action:** Always check if a repository method fetches associated data before using it in a performance-critical loop or list view. Create "light" versions of methods (e.g., without joins/populates) for summaries.
