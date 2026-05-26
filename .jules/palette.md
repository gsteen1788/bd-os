## 2024-05-26 - Keyboard Focus States for Ghost Buttons
**Learning:** In this application, standard utility buttons (`btn-ghost`) and layout buttons (like modal close buttons) often rely entirely on hover states for visual feedback, omitting critical focus indicators for keyboard users.
**Action:** Always append `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md` (or similar, depending on the base border-radius) when creating or auditing `btn-ghost` interactive elements to ensure they are keyboard accessible.
