## 2024-05-15 - Uncaching Date Parsing for High-Entropy Timestamps
**Learning:** In utility functions like `groupItemsByWeek` that operate on arrays of unique database timestamps (e.g., `updatedAt`), caching parsed `Date` objects in a local Map per function call results in a near 0% hit rate. The overhead of Map insertion actually makes this "optimization" 2-3x slower than just directly instantiating `new Date()`.
**Action:** When working with high-entropy or unique timestamps across lists, avoid caching parsed Date objects unless the cache is global, long-lived, and the values are heavily repeated. Prefer direct `new Date(string)` parsing for better performance.
## 2024-05-18 - Optimizing Event Handlers
**Learning:** Avoid premature optimizations in event handlers (e.g. `onClick`). Moving (N)$ operations out of an event handler and into the render loop using `useMemo` can actually degrade performance, as the `useMemo` re-computes on state changes while the event handler only fires once upon interaction.
**Action:** Focus performance optimization on operations executed *during* render cycles or loops. Do not memoize data solely to speed up an `onClick` handler unless it demonstrably lags during user interaction.
## 2026-06-23 - Static hoisting of Layout tabs
**Learning:** Static arrays or objects created inside the React component body get re-allocated on every render, adding garbage collection and memory allocation overhead.
**Action:** When a constant config array or object does not depend on component state or props, it should be hoisted out of the component scope to avoid unnecessary allocations.
