## 2026-02-05 - Hidden Interactive Elements Pattern
**Learning:** The app uses `opacity-0 group-hover:opacity-100` for action buttons, making them invisible to keyboard users when focused.
**Action:** Always check for `opacity-0` on interactive elements and ensure `focus:opacity-100` (or visible focus ring) is present.

## 2026-02-06 - Tooltip Interaction Pattern
**Learning:** Tooltips relying solely on mouse events exclude keyboard users. A generic `FixedTooltip` component was updated to support focus events.
**Action:** Ensure all reusable interaction components (tooltips, dropdowns) handle both pointer and focus events and expose appropriate ARIA roles.

## 2024-05-22 - Accessible Interactive Cards
**Learning:** Interactive elements built with `div`s (like `MitCard`) completely lack keyboard accessibility by default, requiring manual implementation of `role="button"`, `tabIndex`, and `onKeyDown`.
**Action:** Always verify interactive components have keyboard support (Enter/Space) and visible focus indicators, or use native `<button>` elements where possible.
