import type { PlanTaskKind } from '../types'

/**
 * Seed content for the "React σε 14 ημέρες" plan, distilled from
 * docs/react-14-days.md. One entry per day: a short label plus 4–6 typed tasks
 * with a minutes estimate. Each day budgets ~240 minutes, split roughly
 * 40% theory / 60% practice+ship. Days 7 and 13 are ship days.
 *
 * NOTE: the per-day `label` has no column in the data model (the schema stores
 * only tasks keyed by day number), so it lives here as static plan metadata.
 */

export interface SeedTask {
  kind: PlanTaskKind
  title: string
  minutes: number
}

export interface SeedDay {
  day: number
  label: string
  tasks: SeedTask[]
}

export const PLAN_SLUG = 'react-14-days'
export const PLAN_TITLE = 'React σε 14 ημέρες'

export const REACT_14_DAYS: SeedDay[] = [
  {
    day: 1,
    label: 'JS core',
    tasks: [
      { kind: 'theory', title: 'Closures, this, event loop (micro/macrotask), prototype chain', minutes: 60 },
      { kind: 'theory', title: 'map/filter/reduce, destructuring, spread, optional chaining', minutes: 30 },
      { kind: 'practice', title: 'Immutable nested object/array update (χωρίς mutation)', minutes: 45 },
      { kind: 'practice', title: 'Υλοποίησε debounce, deepClone, groupBy (χωρίς libs)', minutes: 75 },
      { kind: 'practice', title: '5 ερωτήσεις φωναχτά (var/let σε loop, ==/===, closure)', minutes: 30 },
    ],
  },
  {
    day: 2,
    label: 'Async',
    tasks: [
      { kind: 'theory', title: 'Promises, async/await, Promise.all vs allSettled vs race', minutes: 55 },
      { kind: 'theory', title: 'Error handling, AbortController, retry με backoff', minutes: 35 },
      { kind: 'practice', title: 'Υλοποίησε fetchWithRetry', minutes: 60 },
      { kind: 'practice', title: 'Υλοποίησε pLimit (max N ταυτόχρονα)', minutes: 60 },
      { kind: 'practice', title: '5 ερωτήσεις φωναχτά', minutes: 30 },
    ],
  },
  {
    day: 3,
    label: 'TypeScript',
    tasks: [
      { kind: 'theory', title: 'interface vs type, unions, generics, keyof, utility types', minutes: 55 },
      { kind: 'theory', title: 'Narrowing, discriminated unions, unknown vs any', minutes: 35 },
      { kind: 'practice', title: 'ApiState<T> + exhaustive render() με never', minutes: 70 },
      { kind: 'practice', title: 'Typing props, events, refs, custom hooks', minutes: 50 },
      { kind: 'practice', title: '5 ερωτήσεις φωναχτά', minutes: 30 },
    ],
  },
  {
    day: 4,
    label: 'Components & state',
    tasks: [
      { kind: 'theory', title: 'JSX, props, controlled vs uncontrolled', minutes: 40 },
      { kind: 'theory', title: 'useState: functional updates, lazy init, async state; keys', minutes: 50 },
      { kind: 'practice', title: 'Todo list με filters (all/active/done)', minutes: 90 },
      { kind: 'practice', title: 'Inline edit στα todos', minutes: 40 },
      { kind: 'practice', title: '5 ερωτήσεις φωναχτά', minutes: 20 },
    ],
  },
  {
    day: 5,
    label: 'useEffect & lifecycle',
    tasks: [
      { kind: 'theory', title: 'Dependency array, cleanup, StrictMode double-run', minutes: 50 },
      { kind: 'theory', title: 'Πότε ΔΕΝ χρειάζεσαι effect; race conditions σε fetch', minutes: 40 },
      { kind: 'practice', title: 'Search input με debounce + cancel προηγούμενου (AbortController)', minutes: 100 },
      { kind: 'practice', title: 'Refactor: αφαίρεσε ένα περιττό effect', minutes: 20 },
      { kind: 'practice', title: '5 ερωτήσεις φωναχτά', minutes: 30 },
    ],
  },
  {
    day: 6,
    label: 'Hooks σε βάθος',
    tasks: [
      { kind: 'theory', title: 'useRef, useMemo, useCallback, useReducer', minutes: 50 },
      { kind: 'theory', title: 'Rules of hooks — και γιατί ισχύουν', minutes: 30 },
      { kind: 'practice', title: 'Custom hooks: useDebounce, useLocalStorage, useToggle', minutes: 70 },
      { kind: 'practice', title: 'Ξαναγράψε το Todo με useReducer + persistence hook', minutes: 70 },
      { kind: 'practice', title: '5 ερωτήσεις φωναχτά', minutes: 20 },
    ],
  },
  {
    day: 7,
    label: 'Context, forms + Ship Εβδ.1',
    tasks: [
      { kind: 'theory', title: 'Context API + περιττά re-renders; composition vs prop drilling', minutes: 45 },
      { kind: 'theory', title: 'Forms: validation, error states, submit handling', minutes: 25 },
      { kind: 'practice', title: 'Multi-step form με validation + shared state', minutes: 70 },
      { kind: 'ship', title: 'Ship Εβδ.1 tool: deploy + Stripe Payment Link + share', minutes: 80 },
      { kind: 'practice', title: '5 ερωτήσεις φωναχτά', minutes: 20 },
    ],
  },
  {
    day: 8,
    label: 'Rendering & performance',
    tasks: [
      { kind: 'theory', title: 'Re-renders, reconciliation, React.memo', minutes: 50 },
      { kind: 'theory', title: 'useMemo/useCallback: πότε όντως βοηθούν', minutes: 40 },
      { kind: 'practice', title: 'Code splitting: lazy + Suspense; virtualize μεγάλη λίστα', minutes: 90 },
      { kind: 'practice', title: 'DevTools Profiler: βρες & διόρθωσε ένα slow render', minutes: 40 },
      { kind: 'practice', title: '3 αιτήσεις εργασίας', minutes: 20 },
    ],
  },
  {
    day: 9,
    label: 'Data fetching & state',
    tasks: [
      { kind: 'theory', title: 'TanStack Query: caching, invalidation, optimistic updates', minutes: 55 },
      { kind: 'theory', title: 'Zustand vs Redux Toolkit; server vs client state', minutes: 35 },
      { kind: 'practice', title: 'TanStack Query: λίστα + optimistic update', minutes: 90 },
      { kind: 'practice', title: 'Zustand store για client state', minutes: 40 },
      { kind: 'practice', title: '3 αιτήσεις εργασίας', minutes: 20 },
    ],
  },
  {
    day: 10,
    label: 'Routing & architecture',
    tasks: [
      { kind: 'theory', title: 'React Router: nested routes, params, protected, loaders', minutes: 50 },
      { kind: 'theory', title: 'Next.js basics: SSR/SSG/CSR, App Router, server components', minutes: 40 },
      { kind: 'practice', title: 'Protected routes + filters στο URL', minutes: 80 },
      { kind: 'practice', title: 'Feature-based folder structure + env vars', minutes: 50 },
      { kind: 'practice', title: '3 αιτήσεις εργασίας', minutes: 20 },
    ],
  },
  {
    day: 11,
    label: 'Testing & tooling',
    tasks: [
      { kind: 'theory', title: 'Vitest + RTL: render, screen, userEvent, async queries', minutes: 50 },
      { kind: 'theory', title: 'Accessibility basics: semantic HTML, ARIA, keyboard nav', minutes: 40 },
      { kind: 'practice', title: 'Tests: render, interaction, custom hook, mocked fetch (MSW)', minutes: 90 },
      { kind: 'practice', title: 'ESLint/Prettier + Vite config polish', minutes: 40 },
      { kind: 'practice', title: '3 αιτήσεις εργασίας', minutes: 20 },
    ],
  },
  {
    day: 12,
    label: 'Micro-SaaS (μέρος 1)',
    tasks: [
      { kind: 'theory', title: 'Checklist micro-SaaS: auth, pagination, optimistic, Stripe', minutes: 40 },
      { kind: 'practice', title: 'Auth + protected routes + Supabase schema', minutes: 90 },
      { kind: 'practice', title: 'Λίστα: server-side pagination, debounced search, URL filters', minutes: 70 },
      { kind: 'practice', title: 'Loading / error / empty states', minutes: 20 },
      { kind: 'practice', title: '3 αιτήσεις εργασίας', minutes: 20 },
    ],
  },
  {
    day: 13,
    label: 'Ship micro-SaaS',
    tasks: [
      { kind: 'theory', title: 'Stripe Checkout + webhook; server-side enforcement του limit', minutes: 40 },
      { kind: 'practice', title: 'CRUD με optimistic update + rollback; 5–8 tests', minutes: 80 },
      { kind: 'ship', title: 'Ship micro-SaaS: deploy, landing page με τιμή, README', minutes: 100 },
      { kind: 'practice', title: '3 αιτήσεις εργασίας', minutes: 20 },
    ],
  },
  {
    day: 14,
    label: 'Interview drill',
    tasks: [
      { kind: 'theory', title: 'Q bank: virtual DOM, controlled/uncontrolled, keys, re-renders', minutes: 50 },
      { kind: 'practice', title: 'Timed: autocomplete με debounce + keyboard nav (25′)', minutes: 30 },
      { kind: 'practice', title: 'Timed: star rating + countdown (controlled)', minutes: 45 },
      { kind: 'practice', title: 'Timed: infinite scroll (IntersectionObserver) + modal focus trap', minutes: 55 },
      { kind: 'practice', title: 'Remote Qs φωναχτά: async TZ, blockers, git workflow', minutes: 40 },
      { kind: 'practice', title: '3 αιτήσεις εργασίας', minutes: 20 },
    ],
  },
]
