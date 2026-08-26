# DBOT Design Rules — Mandatory

**Last updated:** 2026-08-26

## Non-Negotiable Principles

### 1. Open Design (Nexus)
**Source:** https://github.com/nexu-io/open-design

- Local-first design. **No vendor lock-in.** No Figma. No cloud SaaS.
- Design files (`.design/`) live alongside code in the same repo.
- Use plain text, SVG, and the local design toolchain — version-controlled alongside code.
- When in doubt: design with the tools you'd want in 5 years, not the ones marketed today.

### 2. Impeccable (pbakaus)
**Source:** https://github.com/pbakaus/impeccable

- **Mobile-first responsive** — design for 375px, scale up
- **Keyboard accessible** — every interactive element reachable via Tab, operable via Enter/Space
- **Semantic HTML** — `<button>` for buttons, `<a>` for links, `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`
- **No div-soup**
- **Performance budget** — Lighthouse 95+ on every page
- **WCAG AA contrast** minimum, AAA where possible
- **No CLS regressions** — explicit width/height on media
- **Prefer system fonts** as fallback; web fonts must be preloaded

### 3. Brand Alignment — DBOT + DogeOS
- Reference dogeos.com and dbot.dog for canonical design tokens
- DBOT brand: `--purple #8B5CF6` primary, `--gold #BA9F33` accent, dark bg `#0a0a0f`
- DogeOS brand (from dogeos.com): dark navy/black with cyan/teal accents, doge cultural elements
- Match: typography hierarchy, spacing rhythm (8px grid), card patterns

### 4. Visual Verification — Mandatory Before Deploy
**Every new page MUST be visually verified at:**
- Mobile: 375px (iPhone SE)
- Mobile: 390px (iPhone 14)
- Tablet: 768px (iPad)
- Desktop: 1280px
- Desktop: 1920px

Use Playwright/CDP screenshot harness. If ANY viewport breaks layout, fix before declaring done.

### 5. Code Quality
- Single-file output unless user requests modular split
- CSS custom properties in `:root` — no inline magic values
- No `!important` except for accessibility overrides
- ARIA labels on icon-only buttons
- Focus states visible on every interactive element

## Pre-Deploy Checklist

- [ ] Open Design rules respected (local files, version-controlled)
- [ ] Impeccable rules respected (semantic HTML, keyboard nav, mobile-first, performance)
- [ ] Brand tokens match DBOT + DogeOS
- [ ] Visually verified at 375 / 390 / 768 / 1280 / 1920
- [ ] Lighthouse performance > 95
- [ ] WCAG AA contrast verified
- [ ] No CLS regressions
- [ ] All interactive elements keyboard-operable
- [ ] No div-soup

## When to Update This File

- New brand tokens discovered
- New Impeccable rule released
- New Open Design pattern adopted
- DogeOS branding changes
