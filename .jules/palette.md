## 2024-05-22 - Accessibility of Icon-Only Buttons
**Learning:** `opacity-0` elements are invisible to keyboard users even when focused.
**Action:** Always add `focus:opacity-100` (or equivalent) to interactive elements that are hidden by default but reachable via keyboard.

## 2024-05-23 - Accordion Accessibility
**Learning:** Custom accordions using `div` elements with `onClick` are inaccessible to keyboard users and screen readers unless manually instrumented.
**Action:** When creating expandable sections, always use `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-controls`, and `onKeyDown` handlers for Enter/Space, or prefer native `<details>`/`<summary>` if styling permits.

## 2026-02-14 - Clickable Cards Pattern
**Learning:** The app uses `div`s with `onClick` for card interactions (MITs, Admin Tasks), making them inaccessible to keyboard users.
**Action:** Convert clickable cards to `role="button"` with `tabIndex={0}` and `onKeyDown` (Enter/Space) handlers.
