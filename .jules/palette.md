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

## 2026-03-09 - Interactive Elements Should Be Buttons
**Learning:** Using `div` elements with `onClick` handlers for interactive search results or lists makes them inaccessible to keyboard users and screen readers.
**Action:** Always use semantic `<button>` elements (or native `<a>` for links) with `type="button"`, `w-full`, and `text-left` when replacing `div` click areas, ensuring proper focus states with `focus-visible:ring-2`.

## 2026-03-10 - Tabular Inputs and Disconnected Labels
**Learning:** Table header inputs (like in `Tracker.tsx`) and floating labels lack proper screen reader association when implemented without `aria-label` or `htmlFor`/`id` bindings, respectively.
**Action:** Always ensure inputs within tables have context-specific `aria-label`s passed down via props, and associate all `<label>` elements with their `<input>` counterparts using `htmlFor` and `id`.

## 2026-03-10 - Form Label Associations
**Learning:** Relying on implicit label associations (nesting inputs inside `<label>`) isn't always robust, especially when components get complex or inputs aren't direct children. Screen readers may lose the association.
**Action:** Always provide explicit `htmlFor` on `<label>` elements mapped to `id` on `<input>` / `<select>` / `<textarea>` elements, even when nested, to guarantee accessibility.

## 2024-03-24 - Icon-only Button Discoverability
**Learning:** Icon-only buttons (like "✕", "✎") with only `aria-label` are accessible to screen readers, but their action is often completely undiscoverable for sighted mouse users since native tooltips rely on the `title` attribute. Furthermore, interactive buttons dynamically inserted into lists often miss proper focus states, breaking keyboard navigation.
**Action:** Always provide both `aria-label` (for screen readers) AND `title` (for mouse hover tooltips) on icon-only buttons, and ensure they have `focus-visible:ring-2` to support keyboard users.

## 2026-03-17 - Interactive elements must be semantic
**Learning:** Using `div` or `a` tags without `href` for interactive elements causes problems for keyboard navigation and screen readers.
**Action:** Always replace `<div>` or `<a>` with `onClick` handlers using semantic `<button type="button">` elements. Add `w-full text-left` to maintain layout behavior, and `focus-visible:ring-2` to ensure proper focus indicators.
