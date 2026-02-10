## 2024-05-22 - Accessibility of Icon-Only Buttons
**Learning:** `opacity-0` elements are invisible to keyboard users even when focused.
**Action:** Always add `focus:opacity-100` (or equivalent) to interactive elements that are hidden by default but reachable via keyboard.

## 2024-05-24 - Interactive Cards as Divs Pattern
**Learning:** Multiple components (e.g., `MitCard`, task items in `AdminTaskBar`) implement interactivity using `div` with `onClick` but completely lack keyboard accessibility (no `role="button"`, `tabIndex`, or key handlers). This makes core features inaccessible to keyboard users.
**Action:** In future tasks involving these components, prioritize converting them to semantic `<button>` elements or implementing full ARIA button pattern support.
