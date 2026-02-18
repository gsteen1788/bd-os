## 2024-05-22 - Accessibility of Icon-Only Buttons
**Learning:** `opacity-0` elements are invisible to keyboard users even when focused.
**Action:** Always add `focus:opacity-100` (or equivalent) to interactive elements that are hidden by default but reachable via keyboard.

## 2024-05-23 - Accordion Accessibility
**Learning:** Custom accordions using `div` elements with `onClick` are inaccessible to keyboard users and screen readers unless manually instrumented.
**Action:** When creating expandable sections, always use `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-controls`, and `onKeyDown` handlers for Enter/Space, or prefer native `<details>`/`<summary>` if styling permits.

## 2024-05-24 - Discoverability of Primary Actions
**Learning:** `opacity-0` cleaner UI sacrifices discoverability on touch devices and for users who don't explore with hover.
**Action:** Prefer `opacity-40` (or similar low opacity) for persistent actions, ensuring they are visible but subtle, and always include `focus-visible` styles for keyboard navigation.
