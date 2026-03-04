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

## 2026-02-25 - Ad-Hoc Modal Accessibility Gaps
**Learning:** Several modals (e.g., `TaskCompletionModal`) are implemented as custom one-off components rather than reusing the accessible `Modal` component. This leads to missing `role="dialog"`, `aria-modal="true"`, and keyboard accessibility features (like Esc to close).
**Action:** When touching any modal component, verify it implements proper ARIA roles and keyboard handling, or refactor to use the shared `Modal` component if feasible.

## 2026-03-02 - Modal Keyboard Accessibility and Scroll Locking
**Learning:** Some custom modals lack proper keyboard accessibility (like closing on Escape) and allow the background to scroll when open.
**Action:** When adding modals or fixing existing ones, implement an `Escape` key listener to trigger `onClose()` and manage `document.body.style.overflow` (setting to `hidden` on mount and `""` on unmount to restore default styles) for better user experience.

## 2026-03-03 - Icon-only Buttons Accessibility
**Learning:** Icon-only buttons (like `+`, `×`, or emojis) are completely opaque to screen readers if they don't have an `aria-label`. The user experience is significantly degraded when the action is not clear.
**Action:** Always provide a descriptive `aria-label` to buttons that only contain icons or symbols. If the button is part of a list or group, make the label specific (e.g., `aria-label={"Add " + title}`).
