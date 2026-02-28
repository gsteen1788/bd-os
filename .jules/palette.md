## 2024-05-22 - Accessibility of Icon-Only Buttons
**Learning:** `opacity-0` elements are invisible to keyboard users even when focused.
**Action:** Always add `focus:opacity-100` (or equivalent) to interactive elements that are hidden by default but reachable via keyboard.

## 2024-05-23 - Accordion Accessibility
**Learning:** Custom accordions using `div` elements with `onClick` are inaccessible to keyboard users and screen readers unless manually instrumented.
**Action:** When creating expandable sections, always use `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-controls`, and `onKeyDown` handlers for Enter/Space, or prefer native `<details>`/`<summary>` if styling permits.

## 2024-05-24 - Discoverability of Primary Actions
**Learning:** `opacity-0` cleaner UI sacrifices discoverability on touch devices and for users who don't explore with hover.
**Action:** Prefer `opacity-40` (or similar low opacity) for persistent actions, ensuring they are visible but subtle, and always include `focus-visible` styles for keyboard navigation.

## 2024-05-25 - Context in List Actions
**Learning:** Repetitive buttons in lists (e.g., "Complete", "Edit") confuse screen reader users without item context.
**Action:** Always include the item name in `aria-label` for list actions (e.g., `aria-label="Complete ${itemName}"`).
## 2026-02-28 - Emojis and Screen Readers
**Learning:** Adding `role="img"` and `aria-label` to a `div` that contains both an emoji AND dynamic text will cause screen readers to treat the entire container as an image, reading only the `aria-label` and ignoring the dynamic text. This is a critical accessibility regression.
**Action:** When adding accessibility to emojis mixed with text, wrap ONLY the emoji in a `<span role="img" aria-label="...">` rather than applying the attributes to the parent container.
