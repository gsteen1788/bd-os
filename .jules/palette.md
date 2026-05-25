## 2024-05-25 - Focus-visible on interactive circular elements
**Learning:** Adding standard `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md` styles to circular icon-only elements (e.g. `btn-circle`) will override their circular shape and cause visual regressions, as observed in codebase patterns.
**Action:** When adding focus-visible utility classes to buttons that already have `btn-circle`, avoid appending `rounded-md` or similar border-radius utilities.
