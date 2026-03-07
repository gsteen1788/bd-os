## 2024-03-24 - Module-level formatters caching in React UI
**Learning:** `Intl.DateTimeFormat` instantiation is notoriously expensive in JavaScript. When utility functions like `groupItemsByWeek` are called often during React render cycles, instantiating `Intl.DateTimeFormat` and related caching structures (like `Map`) inside the function body introduces significant performance overhead.
**Action:** Always move expensive instantiations such as `Intl.DateTimeFormat` and caching `Map` objects to the module scope (outside the function) so they are preserved across function invocations and avoid repeated allocation during renders.

## 2024-05-15 - Array.find in mapping/render loops
**Learning:** Using `Array.find` inside `.map` functions or frequently-called render helpers (like `getLinkName` for each item) causes $O(N \times M)$ time complexity which creates noticeable lag when rendering large lists.
**Action:** Pre-compute a `Map` or an object lookup dictionary outside the loop (or via `useEffect`/`useMemo` for React render functions) to achieve $O(1)$ lookups, significantly reducing execution time to $O(N + M)$.
