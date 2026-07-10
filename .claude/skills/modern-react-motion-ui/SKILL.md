---
name: modern-react-motion-ui
description: Reference for building high-end dynamic React frontends with shadcn/ui, Aceternity UI, Magic UI, React Bits, Motion, GSAP and Three.js. Use when the brief calls for "dynamic interface + premium frontend feel".
license: Complete terms in LICENSE.txt
---

# Modern React Motion UI Stack

Use this skill when the project needs to move from a plain/static frontend to a high-end, animated, component-rich React interface.

For this codebase specifically: the backend is Spring Boot + JWT + REST APIs. The frontend is currently vanilla HTML/CSS/JS + Vue 3 global build served as static files. A refactor means introducing a React build step (Vite or Next.js standalone) and consuming the existing `/api/**` endpoints.

## Recommended combo

The default stack for a "premium dynamic" feel:

- **shadcn/ui** — accessible, composable base components (button, dialog, table, form, select, etc.)
- **Aceternity UI** — cinematic dark-mode effects (spotlight, beams, 3D cards, tracing beams)
- **Magic UI** — polished animated components (aurora backgrounds, blur text, globe, bento grids)
- **React Bits** — highly customizable text/background/button/card/loaders (best for bespoke motion)
- **Motion (Framer Motion)** — declarative React animations, layout animations, AnimatePresence
- **GSAP** — timeline-driven complex sequences, scroll-triggered choreography
- **Three.js / React Three Fiber** — 3D scenes, particles, medical data visualization

Optional enhancements:

- **Lenis** — smooth scroll
- **Rive** — interactive runtime animations/illustrations
- **Lottie / dotLottie** — lightweight icon/empty-state animations
- **Anime.js** — lightweight timeline animations where GSAP is overkill
- **Radix UI** — already bundled inside shadcn/ui primitives
- **Tailwind CSS** — required by shadcn/Aceternity/Magic UI
- **v0** — can be used to scaffold initial component/page ideas, but always own and refine the code

## How each library contributes

| Library | Role | Best for | Cost / Notes |
|---|---|---|---|
| shadcn/ui | Foundation layer | Buttons, dialogs, tables, forms, dropdowns, tabs | Copies source into your repo; Tailwind required |
| Aceternity UI | Visual drama | Dark hero sections, spotlight cards, background beams, 3D tilt | Best in dark mode; Framer Motion dependency |
| Magic UI | Polish breadth | Aurora backgrounds, blur reveals, animated numbers, globes | Framer Motion dependency; opinionated styling |
| React Bits | Customizable motion | Split text, typewriter, magnetic buttons, aurora backgrounds | No forced Framer Motion; tree-shakeable; 110+ components |
| Motion | React animation | Page transitions, layout shifts, hover states, AnimatePresence | ~125 KB if not already used |
| GSAP | Timeline control | Complex scroll sequences, staggered reveals, pinned sections | Commercial license for certain plugins |
| Three.js / R3F | 3D layer | Particle backgrounds, 3D medical charts, immersive hero | Heavy; use sparingly and lazy-load |
| Lenis | UX polish | Smooth momentum scrolling | Small; pair with GSAP ScrollTrigger |

## Installation patterns

### shadcn/ui (base)

```bash
npx shadcn@latest init
npx shadcn add button dialog table form input select tabs card badge avatar
```

Uses Tailwind CSS v4 (or v3 depending on init defaults) and Radix UI primitives.

### Aceternity UI

```bash
npx shadcn@latest add "https://ui.aceternity.com/registry/spotlight.json"
npx shadcn@latest add "https://ui.aceternity.com/registry/3d-card.json"
```

Components are copied into your project. Expect dependencies on `framer-motion` and `clsx`/`tailwind-merge`.

### Magic UI

```bash
npx shadcn@latest add "https://magicui.design/r/[component-name]"
```

Install individual components; most rely on Framer Motion.

### React Bits

```bash
# shadcn CLI (preferred)
npx shadcn@latest add "https://reactbits.dev/r/split-text"
npx shadcn@latest add "https://reactbits.dev/r/aurora"

# or jsrepo (framework-agnostic)
npx jsrepo add github/DavidHDev/react-bits/text-animations/split-text
```

React Bits components land as source files. They expose more animation props than Aceternity/Magic UI.

### Motion

```bash
npm install motion
```

Previously `framer-motion`. Use `motion.div`, `AnimatePresence`, `useScroll`, `useTransform`.

### GSAP

```bash
npm install gsap @gsap/react
```

Use `useGSAP()` hook. For scroll triggers also import `ScrollTrigger` plugin and register it.

### Lenis

```bash
npm install lenis
```

Wrap the app in a Lenis provider and integrate with GSAP ScrollTrigger.

## Composition rules

1. **shadcn/ui is the base.** Use it for functional components first. Add Aceternity/Magic UI/React Bits as "hero" or "signature" elements, not everywhere.
2. **One signature moment per page.** Let the hero/dashboard header carry the drama; keep data tables and forms clean.
3. **Motion hierarchy:**
   - Micro-interactions (hover, focus) → Tailwind transitions or Motion `whileHover`
   - Page/section reveals → Motion `whileInView` or GSAP ScrollTrigger
   - Complex sequences → GSAP timelines
   - Ambient background → React Bits backgrounds or Three.js canvas
4. **Preserve readability.** A medical dashboard must remain scannable. Motion should guide attention, not compete with data.
5. **Respect `prefers-reduced-motion`.** All animated components should degrade gracefully.

```tsx
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

## Accessibility checklist

- [ ] Animations respect `prefers-reduced-motion`
- [ ] Focus states remain visible after adding glow/shadow effects
- [ ] Color contrast passes WCAG AA even with dark glassmorphism overlays
- [ ] Tables and forms remain keyboard navigable
- [ ] Auto-playing motion stops/pauses on hover or via controls
- [ ] No vestibular triggers (rapid zoom, spinning without user intent)

## Performance checklist

- [ ] Lazy-load 3D/Three.js scenes
- [ ] Use `will-change` sparingly; prefer `transform` and `opacity`
- [ ] Avoid animating `box-shadow`, `filter: blur`, `width/height`
- [ ] Code-split heavy animated sections
- [ ] Keep bundle budget: React Bits is lighter than pulling in Aceternity/Magic UI if Framer Motion isn't already used
- [ ] Use `@media (prefers-reduced-motion: reduce)` to disable expensive ambient effects

## Tailwind theme tokens

When initializing shadcn/ui, align the color tokens to the existing brand:

```css
:root {
  --primary: 168 60% 47%;        /* #3BB39B teal */
  --primary-foreground: 160 30% 8%;
  --background: 160 30% 6%;      /* near-black */
  --foreground: 160 20% 92%;
  --card: 160 20% 10%;
  --card-foreground: 160 20% 92%;
  --border: 160 20% 20%;
  --muted: 160 10% 40%;
  --accent: 188 50% 54%;         /* #4FB6C4 cyan */
  --warning: 38 70% 58%;
  --danger: 0 65% 65%;
}
```

This preserves the existing "墨青 · 临床守护" dark clinical identity while upgrading the component system.

## Migration path for this project

Current state: static files in `src/main/resources/static/` served by Spring Boot.

Recommended refactor steps:

1. Scaffold a React + Vite project in a new folder, e.g. `frontend/` at repo root.
2. Configure Vite proxy to forward `/api/**` to `http://localhost:8080` during development.
3. Init shadcn/ui with the dark teal theme above.
4. Rebuild page-by-page against existing endpoints:
   - Auth pages (`/api/auth/*`)
   - Dashboard (`/api/dashboard/*`, `/api/elders/stats`, `/api/warnings/stats`, `/api/followup/stats`)
   - Elder management (`/api/elders`)
   - Warnings + SSE (`/api/warnings`, `/api/warnings/stream`)
   - Follow-up (`/api/followup/*`)
   - Interventions (`/api/intervention/*`)
   - Assessments + AI (`/api/assessments/*`, `/api/ai/*`)
   - Referrals (`/api/referrals/*`)
   - Vitals (`/api/vitals/*`)
   - Nurse modules (`/api/nurse/*`)
   - Review (`/api/review/*`)
   - Profile (`/api/profile/*`)
5. Add signature motion:
   - Login page: React Bits split-text + Aceternity spotlight background
   - Dashboard: Magic UI animated number + bento grid + React Bits aurora background
   - Warnings: Motion `AnimatePresence` list + GSAP pulse on high-priority cards
   - Vitals: Recharts or Three.js for 3D-ish trend visualization
   - Profile: shadcn avatar upload + Magic UI blur fade-in
6. Build and copy output into `src/main/resources/static/` for Spring Boot deployment, or serve the React app separately behind Nginx.

## When to choose one library over another

- **Dark cinematic landing / hero** → Aceternity UI
- **Polished marketing-style components** → Magic UI
- **Maximum customization + lighter bundle** → React Bits
- **React-native layout/page transitions** → Motion
- **Complex scroll storytelling** → GSAP + Lenis
- **True 3D** → Three.js / React Three Fiber
- **Base accessible UI** → shadcn/ui

## Anti-patterns

- Don't stack three animated backgrounds on one page.
- Don't replace every table with animated cards.
- Don't use Framer Motion + GSAP for the same simple effect; choose one.
- Don't ignore reduced-motion preferences for clinical software.
- Don't import a whole 3D library for one decorative icon.

## Resources

- Aceternity UI: https://ui.aceternity.com/
- Magic UI: https://magicui.design/
- React Bits: https://reactbits.dev/
- shadcn/ui: https://ui.shadcn.com/
- Motion: https://motion.dev/
- GSAP: https://gsap.com/
- React Three Fiber: https://r3f.docs.pmnd.rs/
- Lenis: https://lenis.darkroom.engineering/
