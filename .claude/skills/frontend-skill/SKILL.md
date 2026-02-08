---
name: frontend-skill
description: Build modern frontend interfaces including pages, reusable components, layouts, and styling.
---

# Frontend Skill – Pages, Components, Layout & Styling

## Instructions

1. **Page Structure**
   - Create pages for each route (Home, Login, Dashboard, etc.)
   - Use a clear routing system
   - Keep pages focused on layout and data flow
   - Delegate UI logic to components

2. **Component Design**
   - Build reusable UI components (Button, Card, Modal, Form)
   - Keep components small and single-purpose
   - Use props for configuration
   - Follow atomic design principles where possible

3. **Layout System**
   - Create shared layouts (Navbar, Sidebar, Footer)
   - Use grid or flexbox for structure
   - Ensure responsiveness
   - Maintain visual consistency across pages

4. **Styling**
   - Use CSS, Tailwind, or styled-components
   - Apply consistent spacing, colors, and typography
   - Support light/dark mode if needed
   - Keep styles modular and scalable

5. **State & UI Behavior**
   - Handle loading and error states
   - Manage form inputs and validation
   - Provide feedback (toasts, alerts, spinners)
   - Ensure accessibility (ARIA, keyboard navigation)

---

## Best Practices

- Use mobile-first responsive design
- Keep UI consistent with a design system
- Avoid inline styles when possible
- Use semantic HTML
- Optimize components for reusability
- Keep class names meaningful
- Test UI on different screen sizes
- Follow accessibility standards (WCAG)
- Keep animations smooth and subtle

---

## Example Structure (React + Tailwind)

```tsx
// components/Button.tsx
export function Button({ children }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      {children}
    </button>
  )
}
