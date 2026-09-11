import type { PlanResource, PlanTaskKind } from '../types'

/**
 * Beginner-friendly content for the "React σε 14 ημέρες" plan.
 *
 * Each day has a short `label`, a one-line `focus` (what today is about in plain
 * words) and 4–6 ordered steps. Each step carries a `key` (stable id so progress
 * survives content edits), a friendly `detail` (exactly what to do) and optional
 * `resources` (docs / video / site) shown in the "Τι να διαβάσω;" popup.
 *
 * Budget: ~240 min/day, ~40% theory / 60% practice+ship. Days 7 & 13 ship.
 *
 * NOTE: `label` and `focus` have no column in the schema — they live here as
 * static plan metadata (looked up by day number).
 */

export interface SeedTask {
  key: string
  kind: PlanTaskKind
  title: string
  detail: string
  minutes: number
  resources?: PlanResource[]
}

export interface SeedDay {
  day: number
  label: string
  focus: string
  tasks: SeedTask[]
}

export const PLAN_SLUG = 'react-14-days'
export const PLAN_TITLE = 'React σε 14 ημέρες'
/** Bump when the content below changes so installs re-sync (progress kept). */
export const PLAN_CONTENT_VERSION = 2

// Short helpers to keep the resource lists readable.
const yt = (q: string): string => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`

export const REACT_14_DAYS: SeedDay[] = [
  {
    day: 1,
    label: 'Βάσεις JavaScript',
    focus: 'Σιγουρέψου στα βασικά της JavaScript πριν αγγίξεις React.',
    tasks: [
      {
        key: '1-1',
        kind: 'theory',
        title: 'Διάβασε: closures, this, event loop',
        detail: 'Διάβασε τι είναι closure, πώς δουλεύει το "this" και η σειρά εκτέλεσης (event loop). Κράτα 3 σημειώσεις.',
        minutes: 60,
        resources: [
          { label: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', type: 'docs' },
          { label: 'MDN — Event loop', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop', type: 'docs' },
          { label: 'Βίντεο: JS event loop (YouTube)', url: yt('javascript event loop explained beginners'), type: 'video' },
        ],
      },
      {
        key: '1-2',
        kind: 'theory',
        title: 'Διάβασε: map / filter / reduce & σύγχρονο syntax',
        detail: 'Μάθε map/filter/reduce, destructuring, spread και optional chaining — τα θα τα χρησιμοποιείς συνέχεια.',
        minutes: 30,
        resources: [
          { label: 'MDN — Array.reduce', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce', type: 'docs' },
          { label: 'MDN — Destructuring', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment', type: 'docs' },
        ],
      },
      {
        key: '1-3',
        kind: 'practice',
        title: 'Άσκηση: ενημέρωσε αντικείμενο χωρίς mutation',
        detail: 'Πάρε ένα φωλιασμένο object/array και άλλαξέ το φτιάχνοντας ΝΕΟ αντίγραφο (spread), χωρίς να πειράξεις το αρχικό.',
        minutes: 45,
      },
      {
        key: '1-4',
        kind: 'practice',
        title: 'Άσκηση: γράψε debounce, deepClone, groupBy',
        detail: 'Υλοποίησε τις 3 συναρτήσεις χωρίς βιβλιοθήκες. Δοκίμασέ τες στο console.',
        minutes: 75,
        resources: [
          { label: 'Ασκήσεις: BigFrontend.dev', url: 'https://bigfrontend.dev/', type: 'practice' },
        ],
      },
      {
        key: '1-5',
        kind: 'practice',
        title: 'Πες φωναχτά: 5 ερωτήσεις',
        detail: 'Απάντησε δυνατά: τι είναι closure; διαφορά ==/===; τι τυπώνει var vs let σε loop; τι είναι το event loop;',
        minutes: 30,
      },
    ],
  },
  {
    day: 2,
    label: 'Async JavaScript',
    focus: 'Μάθε να δουλεύεις με δεδομένα που έρχονται "αργότερα" (promises).',
    tasks: [
      {
        key: '2-1',
        kind: 'theory',
        title: 'Διάβασε: Promises & async/await',
        detail: 'Κατάλαβε τι είναι ένα Promise και πώς το async/await κάνει τον async κώδικα να διαβάζεται σαν κανονικός.',
        minutes: 55,
        resources: [
          { label: 'MDN — Using promises', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises', type: 'docs' },
          { label: 'Βίντεο: async/await (YouTube)', url: yt('javascript async await tutorial beginners'), type: 'video' },
        ],
      },
      {
        key: '2-2',
        kind: 'theory',
        title: 'Διάβασε: ακύρωση & retry',
        detail: 'Μάθε τι κάνει το AbortController (ακύρωση request) και πώς γίνεται retry με backoff.',
        minutes: 35,
        resources: [
          { label: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController', type: 'docs' },
          { label: 'MDN — Promise.all', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all', type: 'docs' },
        ],
      },
      {
        key: '2-3',
        kind: 'practice',
        title: 'Άσκηση: fetchWithRetry',
        detail: 'Γράψε συνάρτηση που κάνει fetch και ξαναδοκιμάζει έως 3 φορές αν αποτύχει.',
        minutes: 60,
      },
      {
        key: '2-4',
        kind: 'practice',
        title: 'Άσκηση: pLimit (max N ταυτόχρονα)',
        detail: 'Γράψε βοηθό που τρέχει πολλές async εργασίες αλλά το πολύ N ταυτόχρονα.',
        minutes: 60,
      },
      {
        key: '2-5',
        kind: 'practice',
        title: 'Πες φωναχτά: 5 ερωτήσεις',
        detail: 'Διαφορά Promise.all / allSettled / race; τι κάνει το await; πώς ακυρώνεις ένα request;',
        minutes: 30,
      },
    ],
  },
  {
    day: 3,
    label: 'TypeScript',
    focus: 'Πρόσθεσε τύπους ώστε ο editor να σε προστατεύει από λάθη.',
    tasks: [
      {
        key: '3-1',
        kind: 'theory',
        title: 'Διάβασε: types, interface, generics',
        detail: 'Μάθε interface vs type, unions, generics και τα utility types (Partial, Pick, Omit, Record).',
        minutes: 55,
        resources: [
          { label: 'TS Handbook — Everyday types', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', type: 'docs' },
          { label: 'TS Handbook — Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', type: 'docs' },
        ],
      },
      {
        key: '3-2',
        kind: 'theory',
        title: 'Διάβασε: narrowing & discriminated unions',
        detail: 'Κατάλαβε narrowing, discriminated unions και γιατί το "unknown" είναι ασφαλέστερο από το "any".',
        minutes: 35,
        resources: [
          { label: 'TS Handbook — Narrowing', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html', type: 'docs' },
        ],
      },
      {
        key: '3-3',
        kind: 'practice',
        title: 'Άσκηση: ApiState<T> με exhaustive check',
        detail: 'Φτιάξε ένα union idle/loading/success/error και render() που καλύπτει ΟΛΕΣ τις περιπτώσεις (never).',
        minutes: 70,
      },
      {
        key: '3-4',
        kind: 'practice',
        title: 'Άσκηση: τύποι σε props/events/refs',
        detail: 'Πάρε ένα μικρό component και δώσε σωστούς τύπους σε props, event handlers και ref.',
        minutes: 50,
      },
      {
        key: '3-5',
        kind: 'practice',
        title: 'Πες φωναχτά: 5 ερωτήσεις',
        detail: 'interface vs type; τι είναι generic; unknown vs any; τι είναι discriminated union;',
        minutes: 30,
      },
    ],
  },
  {
    day: 4,
    label: 'React: components & state',
    focus: 'Το πρώτο σου React: components, props και το useState.',
    tasks: [
      {
        key: '4-1',
        kind: 'theory',
        title: 'Διάβασε: JSX, props, controlled inputs',
        detail: 'Μάθε πώς περνάς props και πώς ένα input γίνεται "controlled" από το state.',
        minutes: 40,
        resources: [
          { label: 'react.dev — Learn (ξεκίνα εδώ)', url: 'https://react.dev/learn', type: 'docs' },
          { label: 'react.dev — Responding to events', url: 'https://react.dev/learn/responding-to-events', type: 'docs' },
        ],
      },
      {
        key: '4-2',
        kind: 'theory',
        title: 'Διάβασε: useState & keys σε λίστες',
        detail: 'Κατάλαβε functional updates, lazy init και γιατί τα keys ΔΕΝ πρέπει να είναι το index.',
        minutes: 50,
        resources: [
          { label: 'react.dev — State: memory', url: 'https://react.dev/learn/state-a-components-memory', type: 'docs' },
          { label: 'react.dev — Rendering lists', url: 'https://react.dev/learn/rendering-lists', type: 'docs' },
        ],
      },
      {
        key: '4-3',
        kind: 'practice',
        title: 'Έργο: Todo list με φίλτρα',
        detail: 'Φτιάξε μια λίστα todo με φίλτρα all/active/done. Πρόσθεση, ολοκλήρωση, διαγραφή.',
        minutes: 90,
        resources: [
          { label: 'react.dev — Tic-tac-toe tutorial', url: 'https://react.dev/learn/tutorial-tic-tac-toe', type: 'practice' },
        ],
      },
      {
        key: '4-4',
        kind: 'practice',
        title: 'Πρόσθεσε: inline edit',
        detail: 'Κάνε ώστε πατώντας ένα todo να μπορείς να το επεξεργαστείς επί τόπου.',
        minutes: 40,
      },
      {
        key: '4-5',
        kind: 'practice',
        title: 'Πες φωναχτά: 5 ερωτήσεις',
        detail: 'controlled vs uncontrolled; γιατί όχι index για key; τι είναι functional update;',
        minutes: 20,
      },
    ],
  },
  {
    day: 5,
    label: 'useEffect σωστά',
    focus: 'Μάθε το useEffect — και, το πιο σημαντικό, πότε ΔΕΝ το χρειάζεσαι.',
    tasks: [
      {
        key: '5-1',
        kind: 'theory',
        title: 'Διάβασε: useEffect & cleanup',
        detail: 'Κατάλαβε το dependency array, το cleanup και γιατί σε StrictMode τρέχει 2 φορές.',
        minutes: 50,
        resources: [
          { label: 'react.dev — Synchronizing with effects', url: 'https://react.dev/learn/synchronizing-with-effects', type: 'docs' },
        ],
      },
      {
        key: '5-2',
        kind: 'theory',
        title: 'Διάβασε: πότε ΔΕΝ χρειάζεσαι effect',
        detail: 'Πολλά effects είναι λάθος. Μάθε ποια δεδομένα βγαίνουν από απλό υπολογισμό ή event handler.',
        minutes: 40,
        resources: [
          { label: 'react.dev — You Might Not Need an Effect', url: 'https://react.dev/learn/you-might-not-need-an-effect', type: 'docs' },
        ],
      },
      {
        key: '5-3',
        kind: 'practice',
        title: 'Έργο: search με debounce + ακύρωση',
        detail: 'Φτιάξε input αναζήτησης που περιμένει (debounce) και ακυρώνει το προηγούμενο request (AbortController).',
        minutes: 100,
      },
      {
        key: '5-4',
        kind: 'practice',
        title: 'Refactor: βγάλε ένα περιττό effect',
        detail: 'Βρες στο todo/search σου ένα effect που δεν χρειάζεται και αντικατέστησέ το με απλό υπολογισμό.',
        minutes: 20,
      },
      {
        key: '5-5',
        kind: 'practice',
        title: 'Πες φωναχτά: 5 ερωτήσεις',
        detail: 'Τι κάνει το cleanup; γιατί 2 φορές σε StrictMode; πώς λύνεις race condition σε fetch;',
        minutes: 30,
      },
    ],
  },
  {
    day: 6,
    label: 'Hooks σε βάθος',
    focus: 'Τα υπόλοιπα hooks και πώς φτιάχνεις δικά σου.',
    tasks: [
      {
        key: '6-1',
        kind: 'theory',
        title: 'Διάβασε: useRef, useMemo, useCallback, useReducer',
        detail: 'Μάθε τι λύνει το καθένα. Μην τα βάζεις παντού — μόνο όταν χρειάζονται.',
        minutes: 50,
        resources: [
          { label: 'react.dev — useRef', url: 'https://react.dev/reference/react/useRef', type: 'docs' },
          { label: 'react.dev — useReducer', url: 'https://react.dev/reference/react/useReducer', type: 'docs' },
        ],
      },
      {
        key: '6-2',
        kind: 'theory',
        title: 'Διάβασε: κανόνες των hooks',
        detail: 'Γιατί τα hooks καλούνται πάντα με την ίδια σειρά, στο top level, ποτέ σε if/loop.',
        minutes: 30,
        resources: [
          { label: 'react.dev — Reusing logic with custom hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks', type: 'docs' },
        ],
      },
      {
        key: '6-3',
        kind: 'practice',
        title: 'Έργο: custom hooks',
        detail: 'Φτιάξε useToggle, useDebounce και useLocalStorage και χρησιμοποίησέ τα.',
        minutes: 70,
      },
      {
        key: '6-4',
        kind: 'practice',
        title: 'Refactor: Todo με useReducer',
        detail: 'Ξαναγράψε το Todo με useReducer + ένα hook που το αποθηκεύει στο localStorage.',
        minutes: 70,
      },
      {
        key: '6-5',
        kind: 'practice',
        title: 'Πες φωναχτά: 5 ερωτήσεις',
        detail: 'useMemo vs useCallback (με παράδειγμα όπου είναι άχρηστα); πότε useReducer αντί useState;',
        minutes: 20,
      },
    ],
  },
  {
    day: 7,
    label: 'Context, forms + Ship #1',
    focus: 'Ολοκλήρωσε και ανέβασε το 1ο σου εργαλείο live. Πρώτο ship!',
    tasks: [
      {
        key: '7-1',
        kind: 'theory',
        title: 'Διάβασε: Context & composition',
        detail: 'Μάθε το Context (για να μην περνάς props παντού) και πότε προκαλεί περιττά re-renders.',
        minutes: 45,
        resources: [
          { label: 'react.dev — Passing data with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', type: 'docs' },
        ],
      },
      {
        key: '7-2',
        kind: 'theory',
        title: 'Διάβασε: forms & validation',
        detail: 'Πώς μαζεύεις τιμές, δείχνεις σφάλματα και χειρίζεσαι το submit.',
        minutes: 25,
      },
      {
        key: '7-3',
        kind: 'practice',
        title: 'Έργο: multi-step form',
        detail: 'Φτιάξε φόρμα 2–3 βημάτων με validation και κοινό state ανάμεσα στα βήματα.',
        minutes: 70,
      },
      {
        key: '7-4',
        kind: 'ship',
        title: '🚀 Ship: ανέβασε το εργαλείο σου',
        detail: 'Κάνε deploy (Netlify/Vercel/GitHub Pages), πρόσθεσε Stripe Payment Link και μοιράσου το link.',
        minutes: 80,
        resources: [
          { label: 'Stripe — Payment Links', url: 'https://docs.stripe.com/payment-links', type: 'docs' },
          { label: 'Vite — Deploy a static site', url: 'https://vitejs.dev/guide/static-deploy.html', type: 'docs' },
        ],
      },
      {
        key: '7-5',
        kind: 'practice',
        title: 'Πες φωναχτά: 5 ερωτήσεις',
        detail: 'Πότε Context vs props; τι είναι controlled form; πώς κάνεις validation;',
        minutes: 20,
      },
    ],
  },
  {
    day: 8,
    label: 'Απόδοση (performance)',
    focus: 'Κατάλαβε τι προκαλεί re-render και πώς κρατάς την εφαρμογή γρήγορη.',
    tasks: [
      {
        key: '8-1',
        kind: 'theory',
        title: 'Διάβασε: re-renders & React.memo',
        detail: 'Πότε ξανα-σχεδιάζεται ένα component και πώς το React.memo το αποφεύγει.',
        minutes: 50,
        resources: [
          { label: 'react.dev — Render and commit', url: 'https://react.dev/learn/render-and-commit', type: 'docs' },
          { label: 'react.dev — memo', url: 'https://react.dev/reference/react/memo', type: 'docs' },
        ],
      },
      {
        key: '8-2',
        kind: 'theory',
        title: 'Διάβασε: πότε βοηθούν useMemo/useCallback',
        detail: 'Μάθε πότε ένα memo όντως βοηθάει — και πότε είναι απλώς περιττός κώδικας.',
        minutes: 40,
      },
      {
        key: '8-3',
        kind: 'practice',
        title: 'Έργο: lazy loading + μεγάλη λίστα',
        detail: 'Σπάσε κώδικα με lazy + Suspense και κάνε virtualize μια λίστα με χιλιάδες γραμμές.',
        minutes: 90,
      },
      {
        key: '8-4',
        kind: 'practice',
        title: 'Άσκηση: Profiler',
        detail: 'Με το React DevTools Profiler βρες ένα αργό render και διόρθωσέ το.',
        minutes: 40,
        resources: [
          { label: 'Βίντεο: React Profiler (YouTube)', url: yt('react devtools profiler tutorial'), type: 'video' },
        ],
      },
      {
        key: '8-5',
        kind: 'practice',
        title: 'Στείλε 3 αιτήσεις εργασίας',
        detail: 'Ξεκίνα να στέλνεις βιογραφικά από σήμερα — μην περιμένεις να "τελειώσεις".',
        minutes: 20,
      },
    ],
  },
  {
    day: 9,
    label: 'Δεδομένα & state management',
    focus: 'Πώς φέρνεις δεδομένα από server και τα διαχειρίζεσαι σωστά.',
    tasks: [
      {
        key: '9-1',
        kind: 'theory',
        title: 'Διάβασε: TanStack Query',
        detail: 'Μάθε caching, invalidation και optimistic updates — ο κανονικός τρόπος για server data.',
        minutes: 55,
        resources: [
          { label: 'TanStack Query — Overview', url: 'https://tanstack.com/query/latest/docs/framework/react/overview', type: 'docs' },
          { label: 'TanStack Query — Optimistic updates', url: 'https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates', type: 'docs' },
        ],
      },
      {
        key: '9-2',
        kind: 'theory',
        title: 'Διάβασε: server vs client state',
        detail: 'Κατάλαβε τη διαφορά και πού ταιριάζει ένα store όπως το Zustand.',
        minutes: 35,
        resources: [
          { label: 'Zustand — Introduction', url: 'https://zustand.docs.pmnd.rs/getting-started/introduction', type: 'docs' },
        ],
      },
      {
        key: '9-3',
        kind: 'practice',
        title: 'Έργο: λίστα με TanStack Query',
        detail: 'Φέρε μια λίστα με useQuery και κάνε ένα optimistic update σε αλλαγή.',
        minutes: 90,
      },
      {
        key: '9-4',
        kind: 'practice',
        title: 'Πρόσθεσε: Zustand store',
        detail: 'Βάλε ένα μικρό Zustand store για client state (π.χ. theme ή φίλτρα).',
        minutes: 40,
      },
      {
        key: '9-5',
        kind: 'practice',
        title: 'Στείλε 3 αιτήσεις εργασίας',
        detail: 'Συνέχισε τις αιτήσεις — στόχος 3 την ημέρα.',
        minutes: 20,
      },
    ],
  },
  {
    day: 10,
    label: 'Routing & δομή project',
    focus: 'Πολλαπλές σελίδες, προστατευμένες διαδρομές και καθαρή οργάνωση.',
    tasks: [
      {
        key: '10-1',
        kind: 'theory',
        title: 'Διάβασε: React Router',
        detail: 'Μάθε nested routes, params και protected routes (σελίδες που θέλουν login).',
        minutes: 50,
        resources: [
          { label: 'React Router — Tutorial', url: 'https://reactrouter.com/en/main/start/tutorial', type: 'docs' },
        ],
      },
      {
        key: '10-2',
        kind: 'theory',
        title: 'Διάβασε: Next.js βασικά (SSR/SSG/CSR)',
        detail: 'Σε επίπεδο συζήτησης: τι σημαίνουν και πότε ταιριάζει το καθένα.',
        minutes: 40,
        resources: [
          { label: 'Next.js — Learn', url: 'https://nextjs.org/learn', type: 'docs' },
        ],
      },
      {
        key: '10-3',
        kind: 'practice',
        title: 'Έργο: protected routes + φίλτρα στο URL',
        detail: 'Βάλε login-gated σελίδα και κράτα τα φίλτρα λίστας μέσα στο URL.',
        minutes: 80,
      },
      {
        key: '10-4',
        kind: 'practice',
        title: 'Οργάνωσε: feature-based folders',
        detail: 'Τακτοποίησε τον κώδικα ανά feature και πρόσθεσε env vars.',
        minutes: 50,
      },
      {
        key: '10-5',
        kind: 'practice',
        title: 'Στείλε 3 αιτήσεις εργασίας',
        detail: 'Κράτα τον ρυθμό — 3 αιτήσεις.',
        minutes: 20,
      },
    ],
  },
  {
    day: 11,
    label: 'Testing & εργαλεία',
    focus: 'Γράψε tests που δίνουν σιγουριά και βασική προσβασιμότητα.',
    tasks: [
      {
        key: '11-1',
        kind: 'theory',
        title: 'Διάβασε: Vitest + Testing Library',
        detail: 'Μάθε render, screen, userEvent και async queries — δοκιμάζεις όπως ο χρήστης.',
        minutes: 50,
        resources: [
          { label: 'Testing Library — React intro', url: 'https://testing-library.com/docs/react-testing-library/intro/', type: 'docs' },
          { label: 'Vitest — Guide', url: 'https://vitest.dev/guide/', type: 'docs' },
        ],
      },
      {
        key: '11-2',
        kind: 'theory',
        title: 'Διάβασε: accessibility βασικά',
        detail: 'Semantic HTML, ARIA και πλοήγηση με πληκτρολόγιο — μικρές συνήθειες, μεγάλη διαφορά.',
        minutes: 40,
        resources: [
          { label: 'web.dev — Learn Accessibility', url: 'https://web.dev/learn/accessibility/', type: 'docs' },
        ],
      },
      {
        key: '11-3',
        kind: 'practice',
        title: 'Έργο: γράψε 4 tests',
        detail: 'Test για: render, interaction χρήστη, ένα custom hook, και ένα mocked fetch (MSW).',
        minutes: 90,
        resources: [
          { label: 'MSW — Docs', url: 'https://mswjs.io/docs/', type: 'docs' },
        ],
      },
      {
        key: '11-4',
        kind: 'practice',
        title: 'Ρύθμισε: ESLint/Prettier + Vite',
        detail: 'Βάλε lint/format και πέρνα μια ματιά στο vite config.',
        minutes: 40,
      },
      {
        key: '11-5',
        kind: 'practice',
        title: 'Στείλε 3 αιτήσεις εργασίας',
        detail: '3 αιτήσεις ακόμη.',
        minutes: 20,
      },
    ],
  },
  {
    day: 12,
    label: 'Micro-SaaS (μέρος 1)',
    focus: 'Ξεκίνα το capstone: auth, λίστα με σελιδοποίηση, καθαρά states.',
    tasks: [
      {
        key: '12-1',
        kind: 'theory',
        title: 'Διάβασε: checklist micro-SaaS',
        detail: 'Δες τι πρέπει να έχει: auth, protected routes, pagination, optimistic, Stripe.',
        minutes: 40,
        resources: [
          { label: 'Supabase — Auth', url: 'https://supabase.com/docs/guides/auth', type: 'docs' },
        ],
      },
      {
        key: '12-2',
        kind: 'practice',
        title: 'Έργο: auth + Supabase schema',
        detail: 'Στήσε login/logout, protected routes και τους πίνακες στη βάση.',
        minutes: 90,
      },
      {
        key: '12-3',
        kind: 'practice',
        title: 'Έργο: λίστα με pagination & search',
        detail: 'Λίστα με server-side pagination, debounced search και φίλτρα στο URL.',
        minutes: 70,
      },
      {
        key: '12-4',
        kind: 'practice',
        title: 'Πρόσθεσε: loading / error / empty states',
        detail: 'Κάθε οθόνη να δείχνει κάτι λογικό όταν φορτώνει, αποτυγχάνει ή είναι άδεια.',
        minutes: 20,
      },
      {
        key: '12-5',
        kind: 'practice',
        title: 'Στείλε 3 αιτήσεις εργασίας',
        detail: '3 αιτήσεις.',
        minutes: 20,
      },
    ],
  },
  {
    day: 13,
    label: 'Ship το micro-SaaS',
    focus: 'Πληρωμές, τελευταία tests και deploy. Δεύτερο ship!',
    tasks: [
      {
        key: '13-1',
        kind: 'theory',
        title: 'Διάβασε: Stripe Checkout + webhook',
        detail: 'Πώς δέχεσαι πληρωμή και πώς το webhook ενημερώνει το plan στη βάση — και επιβάλλεις το όριο server-side.',
        minutes: 40,
        resources: [
          { label: 'Stripe — Checkout quickstart', url: 'https://docs.stripe.com/checkout/quickstart', type: 'docs' },
          { label: 'Stripe — Webhooks', url: 'https://docs.stripe.com/webhooks', type: 'docs' },
        ],
      },
      {
        key: '13-2',
        kind: 'practice',
        title: 'Έργο: CRUD + optimistic + 5–8 tests',
        detail: 'Ολοκλήρωσε δημιουργία/επεξεργασία/διαγραφή με optimistic update + rollback, και γράψε 5–8 tests.',
        minutes: 80,
      },
      {
        key: '13-3',
        kind: 'ship',
        title: '🚀 Ship: deploy + landing page',
        detail: 'Κάνε deploy, φτιάξε landing page με τιμή πάνω της, και γράψε καθαρό README.',
        minutes: 100,
      },
      {
        key: '13-4',
        kind: 'practice',
        title: 'Στείλε 3 αιτήσεις εργασίας',
        detail: '3 αιτήσεις.',
        minutes: 20,
      },
    ],
  },
  {
    day: 14,
    label: 'Interview drill',
    focus: 'Εξάσκηση σε ερωτήσεις και live coding με χρονόμετρο.',
    tasks: [
      {
        key: '14-1',
        kind: 'theory',
        title: 'Επανάληψη: τράπεζα ερωτήσεων',
        detail: 'Απάντησε: virtual DOM/reconciliation, controlled/uncontrolled, keys, περιττά re-renders.',
        minutes: 50,
        resources: [
          { label: 'GreatFrontend — Questions', url: 'https://www.greatfrontend.com/questions', type: 'practice' },
        ],
      },
      {
        key: '14-2',
        kind: 'practice',
        title: 'Live coding: autocomplete (25′)',
        detail: 'Με χρονόμετρο: autocomplete με debounce + πλοήγηση με πληκτρολόγιο.',
        minutes: 30,
      },
      {
        key: '14-3',
        kind: 'practice',
        title: 'Live coding: star rating + countdown',
        detail: 'Με χρονόμετρο: controlled star rating και countdown timer με start/pause/reset.',
        minutes: 45,
      },
      {
        key: '14-4',
        kind: 'practice',
        title: 'Live coding: infinite scroll + modal',
        detail: 'Με χρονόμετρο: infinite scroll (IntersectionObserver) και modal με focus trap + ESC.',
        minutes: 55,
      },
      {
        key: '14-5',
        kind: 'practice',
        title: 'Remote ερωτήσεις φωναχτά',
        detail: 'Απάντησε: δουλειά σε άλλη ζώνη ώρας, πώς λες ένα blocker, git workflow/PR reviews.',
        minutes: 40,
      },
      {
        key: '14-6',
        kind: 'practice',
        title: 'Στείλε 3 αιτήσεις εργασίας',
        detail: 'Τελευταίες 3 για σήμερα — και συνέχισε καθημερινά.',
        minutes: 20,
      },
    ],
  },
]
