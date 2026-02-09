---
name: nextjs-build-runtime-optimization-skill
description: Optimize Next.js frontend builds and runtime in Vercel for performance, accessibility, and stable production deployment without affecting core functionality.
---

# Build and Runtime Optimization for Next.js

## Instructions

1. **Configure Build and Output Settings**
   - Use Next.js recommended production build: `next build` and `next start` (Vercel automatically handles this)
   - Set output directory correctly for Vercel (`.next`)
   - Enable **SWC compiler** for faster builds and optimized transpilation
   - Consider incremental static regeneration (ISR) and static site generation (SSG) where applicable

2. **Optimize Images, Fonts, and Assets**
   - Use Next.js `next/image` for responsive, optimized images
   - Preload fonts or use `next/font` for automatic optimization
   - Compress and serve assets efficiently
   - Remove unused assets and files to reduce payload

3. **Reduce Bundle Size**
   - Analyze bundle with `next build && next analyze` or `next/bundle-analyzer`
   - Code-split components and pages to reduce initial load
   - Tree-shake unused dependencies
   - Avoid large client-side libraries unless necessary

4. **Ensure Fast Page Load and Runtime Stability**
   - Enable caching headers for static assets
   - Use dynamic imports for heavy components
   - Monitor runtime logs and errors in Vercel dashboard
   - Validate frontend accessibility and responsiveness post-build

5. **Accessibility & Reliability**
   - Confirm that optimizations do not break accessibility features
   - Test pages with screen readers and keyboard navigation
   - Ensure smooth animations and responsive layout remain intact
   - Maintain stable behavior under concurrent user requests

---

## Best Practices

- Keep builds reproducible and version-controlled
- Optimize images, fonts, and assets for performance
- Split code to reduce bundle size
- Monitor Vercel build and runtime logs
- Test accessibility after optimizations
- Use environment variables for config without exposing secrets
- Validate both preview and production deployments

---

## Example Build Commands (Vercel)

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Analyze bundle size (optional)
npm run analyze

# Preview deployment (optional)
npm run start
