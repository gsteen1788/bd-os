## 2024-05-22 - Accessibility of Icon-Only Buttons
**Learning:** `opacity-0` elements are invisible to keyboard users even when focused.
**Action:** Always add `focus:opacity-100` (or equivalent) to interactive elements that are hidden by default but reachable via keyboard.

## 2024-05-23 - Accordion Accessibility
**Learning:** Custom accordions using `div` elements with `onClick` are inaccessible to keyboard users and screen readers unless manually instrumented.
**Action:** When creating expandable sections, always use `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-controls`, and `onKeyDown` handlers for Enter/Space, or prefer native `<details>`/`<summary>` if styling permits.

## 2026-02-17 - Clickable Cards with Actions
**Learning:** Complex cards with a primary click action often have redundant inner buttons (e.g., title link) which clutter the tab order.
**Action:** Use `role="button"` on the card container for the primary action. Convert inner primary links/buttons to static text to remove redundant tab stops, while keeping secondary actions (like 'delete') as nested buttons with `stopPropagation`.
