## 2026-02-05 - Hidden Interactive Elements Pattern
**Learning:** The app uses `opacity-0 group-hover:opacity-100` for action buttons, making them invisible to keyboard users when focused.
**Action:** Always check for `opacity-0` on interactive elements and ensure `focus:opacity-100` (or visible focus ring) is present.

## 2026-02-06 - Tooltip Interaction Pattern
**Learning:** Tooltips relying solely on mouse events exclude keyboard users. A generic `FixedTooltip` component was updated to support focus events.
**Action:** Ensure all reusable interaction components (tooltips, dropdowns) handle both pointer and focus events and expose appropriate ARIA roles.

## 2026-02-07 - Complex Card Accessibility
**Learning:** Wrapping a complex card with `role="button"` creates invalid ARIA structures when it contains nested interactive elements.
**Action:** Use a semantic `<h3><button>...</button></h3>` for the card title to serve as the primary keyboard action, while keeping the outer container click handler for mouse users.

## 2026-02-08 - Stretched Link Pattern for Cards
**Learning:** Using `onClick` on a container `div` creates poor accessibility. The "Stretched Link" pattern (using `::after` on the primary action to cover the container) is a robust solution that preserves semantic structure while maintaining a large click target.
**Action:** When implementing clickable cards, remove container click handlers. Use `after:absolute after:inset-0` on the primary link/button, and ensure secondary interactive elements have `relative z-10`.
## 2026-04-02 - Floating Widget Accessibility
**Learning:** Floating, non-modal widgets with icon-only trigger and close buttons need explicit ARIA links (`aria-expanded`, `aria-controls`) and focus states (`focus-visible`) to be accessible for screen reader and keyboard users.
**Action:** When implementing floating interactive widgets, always explicitly define structural ARIA relationships between the trigger button and the popup container, and ensure all interior buttons have `focus-visible` styles.
