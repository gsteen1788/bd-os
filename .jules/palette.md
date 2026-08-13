## 2024-05-24 - Add ARIA Labels to inline inputs
**Learning:** Inputs formatted as inline elements without explicit labels (like those added dynamically inside generic components or popups) need to have `aria-label` attributes set to communicate their purpose to screen readers. For example, the 'New Company' input fields in the ProtemoiBoard used `placeholder` text, which is an accessibility anti-pattern.
**Action:** When adding or discovering inline inputs without a corresponding `<label>` (especially if relying on placeholders for context), add a clear `aria-label` attribute describing the input's purpose.
## 2024-05-25 - Unlabeled Select Elements for View Filters
**Learning:** Native `<select>` elements acting as interactive toggles (like "View Mode" or "Filters") without explicit text `<label>` elements are invisible to screen readers, leaving users with no context on what the dropdown controls.
**Action:** When using `<select>` tags as inline filters or view switchers, always ensure they have an explicit `aria-label` attribute (e.g., `aria-label="Toggle view mode"`) to guarantee accessibility compliance.
## 2024-05-24 - Semantic Buttons for Complex Interactive Toggles
**Learning:** Using `div` with `role="button"` and manual `onKeyDown` handlers for complex interactive toggles (like the B.I.G. criteria accordion buttons) is an anti-pattern. Natively, screen readers and keyboard navigation correctly trigger standard `<button>` elements with `Space` and `Enter` implicitly without extra event listeners.
**Action:** Always refactor generic container elements mimicking buttons to `<button type="button">` and apply `w-full text-left block` for layout preservation.
## 2024-05-26 - Missing Base Classes for DaisyUI Modifiers
**Learning:** In utility-first frameworks mimicking DaisyUI (like this project's custom `index.css`), modifier classes such as `btn-ghost` or `btn-sm` do not implicitly apply base component styles. Using `className="btn-ghost"` without the `btn` class strips elements of foundational button styling, structural padding, standard heights, and proper touch targets, causing visual inconsistencies and accessibility issues.
**Action:** Always ensure modifier classes are paired with their base class (e.g., `className="btn btn-ghost"`) to inherit required structural and interactive styles.
