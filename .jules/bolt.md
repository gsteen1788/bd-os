## 2026-02-10 - [React Render Loop Bottleneck]
**Learning:** `MitCard` component was performing O(N) array lookups for related entities (Opportunities, Relationships) inside its render loop, causing O(N*M) complexity where N=tasks, M=entities. This becomes a bottleneck with large datasets.
**Action:** Always pre-compute lookup Maps in parent components (using `useMemo`) and pass them down for O(1) access to prevent repetitive array scanning in render cycles.

## 2026-02-14 - [Board Rendering Bottleneck]
**Learning:** `ProtemoiBoard` was repeatedly filtering the full `entries` list (potentially large) inside the render loop for each relationship stage column, leading to O(S*N) complexity (where S=stages) on every re-render. This was exacerbated by typing in the modal, which triggered parent re-renders.
**Action:** Use `useMemo` to filter and group data once, providing O(1) access to stage-specific entries in the render loop.
