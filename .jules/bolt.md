## 2026-02-10 - [React Render Loop Bottleneck]
**Learning:** `MitCard` component was performing O(N) array lookups for related entities (Opportunities, Relationships) inside its render loop, causing O(N*M) complexity where N=tasks, M=entities. This becomes a bottleneck with large datasets.
**Action:** Always pre-compute lookup Maps in parent components (using `useMemo`) and pass them down for O(1) access to prevent repetitive array scanning in render cycles.

## 2026-02-10 - [Memoization of Expensive Derived State]
**Learning:** `Dashboard` component was re-calculating `groupItemsByWeek` (involving date parsing and string manipulation) on every render, even when the data (`mits`) hadn't changed. This negates the benefits of memoizing child components.
**Action:** Wrap expensive data transformation logic (like grouping or sorting large lists) in `useMemo` to ensure it only runs when dependencies change.
