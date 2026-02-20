## 2026-02-05 - Hidden Interactive Elements Pattern
**Learning:** The app uses `opacity-0 group-hover:opacity-100` for action buttons, making them invisible to keyboard users when focused.
**Action:** Always check for `opacity-0` on interactive elements and ensure `focus:opacity-100` (or visible focus ring) is present.

## 2026-02-06 - Tooltip Interaction Pattern
**Learning:** Tooltips relying solely on mouse events exclude keyboard users. A generic `FixedTooltip` component was updated to support focus events.
**Action:** Ensure all reusable interaction components (tooltips, dropdowns) handle both pointer and focus events and expose appropriate ARIA roles.

## 2026-02-07 - Complex Card Accessibility
**Learning:** Wrapping a complex card with `role="button"` creates invalid ARIA structures when it contains nested interactive elements.
**Action:** Use a semantic `<h3><button>...</button></h3>` for the card title to serve as the primary keyboard action, while keeping the outer container click handler for mouse users.

## 2026-02-20 - Stretched Link Pattern for Clickable Cards
**Learning:** Using a `div` `onClick` for clickable cards creates redundancy and accessibility issues. The "Stretched Link" pattern (pseudo-element on the primary interactive child covering the parent) unifies the interaction target.
**Action:** Replace `onClick` on card containers with `before:absolute before:inset-0` on the primary action button, ensuring the container is `relative` and other interactive elements have higher z-index.
