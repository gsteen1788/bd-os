## 2024-05-22 - Accessibility of Icon-Only Buttons
**Learning:** `opacity-0` elements are invisible to keyboard users even when focused.
**Action:** Always add `focus:opacity-100` (or equivalent) to interactive elements that are hidden by default but reachable via keyboard.

## 2024-05-23 - Accordion Accessibility
**Learning:** Custom accordions using `div` elements with `onClick` are inaccessible to keyboard users and screen readers unless manually instrumented.
**Action:** When creating expandable sections, always use `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-controls`, and `onKeyDown` handlers for Enter/Space, or prefer native `<details>`/`<summary>` if styling permits.

## 2024-05-24 - Interactive Card Accessibility
**Learning:** Large clickable areas like cards (`<div onClick={...}>`) are frequently used but often lack keyboard accessibility (`tabIndex={0}`, `role="button"`, `onKeyDown`).
**Action:** When making a whole card interactive, always treat it as a button: add `role="button"`, `tabIndex={0}`, `aria-label`, and `onKeyDown` for Enter/Space activation to ensure keyboard users can access the primary action.
