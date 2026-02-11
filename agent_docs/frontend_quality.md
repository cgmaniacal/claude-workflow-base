# Frontend Quality Standards

Read this before building any user-facing feature. These standards apply during both Implement and Validate phases.

## Accessibility (WCAG 2.1 AA)

Every component must meet [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa) compliance.

### HTML Semantics

- Use semantic elements: `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`, `<aside>`
- Headings follow hierarchy (`h1` → `h2` → `h3`) — never skip levels
- Use `<button>` for actions, `<a>` for navigation — never `<div onClick>`
- Lists use `<ul>`/`<ol>`, tables use `<table>` with `<th scope>`

### Keyboard Navigation

- All interactive elements reachable via Tab
- Visible focus indicators on every focusable element (never `outline: none` without a replacement)
- Modal/dropdown traps focus while open, returns focus on close
- Custom widgets implement [ARIA authoring practices](https://www.w3.org/WAI/ARIA/apg/) keyboard patterns

### Screen Readers

- Images: `alt` text on all `<img>` (decorative images use `alt=""`)
- Forms: every input has an associated `<label>` (or `aria-label`/`aria-labelledby`)
- Dynamic content: use `aria-live` regions for updates that should be announced
- Icons: icon-only buttons must have `aria-label`

### Color and Contrast

- Text contrast ratio: minimum 4.5:1 (normal text), 3:1 (large text, 18px+ or 14px+ bold)
- Never rely on color alone to convey meaning — use text, icons, or patterns alongside
- Test with both light and dark themes if applicable

### Testing

- Tab through every page to verify keyboard flow
- Test with a screen reader (VoiceOver on Mac) for major features
- Run `axe-core` or Lighthouse accessibility audits during Validate phase

## Responsive Design

All layouts must work across mobile (320px), tablet (768px), and desktop (1024px+).

### Approach

- **Mobile-first**: write base styles for small screens, use `min-width` media queries to enhance for larger screens
- Use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Prefer `flex` and `grid` over fixed widths
- Use relative units (`rem`, `%`, `vw/vh`) over fixed `px` for layout dimensions

### Breakpoints

Follow Tailwind defaults:

| Prefix | Min-width | Target |
|--------|-----------|--------|
| (base) | 0px | Mobile |
| `sm:` | 640px | Large phone / small tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Wide desktop |

### Touch Targets

- Minimum tap target size: 44x44px (WCAG 2.5.5)
- Adequate spacing between interactive elements on mobile

### Testing

- Resize browser from 320px to 1920px — no horizontal scroll, no overlapping content
- Test on actual mobile devices when possible (or Chrome DevTools device mode)

## Performance

Target: Lighthouse scores of 90+ across all categories (Performance, Accessibility, Best Practices, SEO).

### Images

- Use responsive images: `srcset` and `sizes` attributes, or `<picture>` element
- Serve modern formats (WebP/AVIF) with fallbacks
- Lazy-load below-the-fold images: `loading="lazy"`
- Set explicit `width` and `height` to prevent layout shift
- Use ThumbHash placeholders for smooth loading — see `agent_docs/image_optimization.md` for the full pipeline

### Code Splitting

- Route-based splitting with `React.lazy()` and `Suspense`
- Avoid importing large libraries at the top level — use dynamic `import()` where possible
- Monitor bundle size: `npx vite-bundle-visualizer` to identify bloat

### Rendering

- Memoize expensive computations: `useMemo` for derived data, `React.memo` for pure components (only when profiling shows a problem — don't premature-optimize)
- Avoid layout thrashing: batch DOM reads/writes
- Minimize re-renders: keep state close to where it's used

### Core Web Vitals

| Metric | Target | What it measures |
|--------|--------|-----------------|
| LCP (Largest Contentful Paint) | < 2.5s | How fast the main content loads |
| INP (Interaction to Next Paint) | < 200ms | How fast the page responds to input |
| CLS (Cumulative Layout Shift) | < 0.1 | How much the layout shifts during load |

### Testing

- Run Lighthouse in CI or during Validate phase
- Profile with React DevTools Profiler when components feel slow

## SEO (When Applicable)

These standards apply when the project is a **public-facing website** (marketing site, blog, docs, etc.). Skip for internal apps, dashboards, or tools behind authentication.

### Fundamentals

- Every page has a unique `<title>` and `<meta name="description">`
- Use semantic HTML (same rules as accessibility — good semantics help both)
- One `<h1>` per page reflecting the page's primary topic
- Clean URL structure: `/about`, `/blog/my-post` — not `/page?id=123`

### Technical SEO

- Server-side rendering or static generation for content pages (consider frameworks like Next.js or Astro if SEO is critical — Vite SPA alone has limited SEO)
- Canonical URLs: `<link rel="canonical">` on every page
- Structured data (JSON-LD) for rich search results where applicable
- `robots.txt` and XML sitemap

### Meta Tags

```html
<head>
  <title>Page Title — Site Name</title>
  <meta name="description" content="Concise description under 160 chars">
  <meta property="og:title" content="Page Title">
  <meta property="og:description" content="Description for social sharing">
  <meta property="og:image" content="/path/to/share-image.jpg">
</head>
```

### Testing

- Validate with Google Lighthouse SEO audit
- Check rendered output with `curl` or "View Source" to ensure content is in the HTML (not only rendered via JS)

## Checklist (Validate Phase)

Use this during the Validate workflow phase:

- [ ] Keyboard-navigable: all interactive elements reachable via Tab
- [ ] Screen reader: labels on inputs, alt on images, semantic HTML
- [ ] Color contrast: 4.5:1 for normal text, 3:1 for large text
- [ ] Responsive: no issues at 320px, 768px, 1024px
- [ ] Lighthouse: 90+ on Performance, Accessibility, Best Practices
- [ ] Images: responsive, lazy-loaded, explicit dimensions
- [ ] SEO (if public site): unique titles, meta descriptions, semantic headings
