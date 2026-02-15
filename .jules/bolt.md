## 2026-02-10 - [React Render Loop Bottleneck]
**Learning:** `MitCard` component was performing O(N) array lookups for related entities (Opportunities, Relationships) inside its render loop, causing O(N*M) complexity where N=tasks, M=entities. This becomes a bottleneck with large datasets.
**Action:** Always pre-compute lookup Maps in parent components (using `useMemo`) and pass them down for O(1) access to prevent repetitive array scanning in render cycles.

## 2026-02-12 - [Date Formatting Bottleneck]
**Learning:** `toLocaleDateString` is extremely slow and when used inside loop-heavy functions like `groupItemsByWeek`, it can block the main thread (10k items took ~1s). Using it inside a React render loop (via IIFE) caused significant UI jank.
**Action:** Cache formatted date strings when processing large lists of dates. Also, always memoize expensive data transformation functions used in render methods.
