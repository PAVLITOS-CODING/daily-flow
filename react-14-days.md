# React σε 14 ημέρες — Interview Ready (Remote)

**Ρυθμός:** 3–5 ώρες/ημέρα → **40% θεωρία / 60% πράξη**.
Σε 4ωρη μέρα: 1.5h docs + ερωτήσεις, 2.5h κώδικας. Η θεωρία πάντα **πριν** τον κώδικα της ίδιας μέρας, ποτέ σε ξεχωριστή μέρα.
**Κανόνας:** κάθε μέρα κλείνει με (α) κώδικα που τρέχει, (β) 5 ερωτήσεις που απαντάς φωναχτά.
**Κανόνας 2:** κάθε εβδομάδα κλείνει με ένα **deployed προϊόν που μπορεί να πληρωθεί**.

---

## Τα δύο εβδομαδιαία projects

Το κλειδί: μην φτιάξεις "portfolio project". Φτιάξε κάτι που έχει τιμή πάνω του. Στο interview η ερώτηση «έχεις κάτι live;» απαντιέται με URL και με «έχει Χ χρήστες».

### Εβδομάδα 1 — Client-side tool, πληρωμή one-off
Χωρίς backend, χωρίς database, χωρίς κόστος hosting. Όλα τρέχουν στον browser.

**Μοντέλο:** δωρεάν με περιορισμό (π.χ. watermark, 3 exports/μέρα, 1 template) → ξεκλείδωμα €9–19 εφάπαξ μέσω Stripe Payment Link. Το "κλειδί" είναι license key σε localStorage — δεν είναι αλεξίσφαιρο, αλλά σε αυτή την τιμή δεν πειράζει.

**Επιλογές (διάλεξε 1, μην το συζητήσεις πάνω από 30 λεπτά):**
- Invoice/quote generator → PDF export, templates, αποθήκευση πελατών τοπικά
- Bulk image resizer/compressor/converter → Canvas API, ZIP download
- CV builder → live preview, ATS-friendly PDF
- Meta tag / OG image previewer για devs

**Tech:** React + TS + Vite + Tailwind. `jspdf`/`html2canvas` ή Canvas API. Zero backend.
**Χτίζεται:** Ημ. 4–7, ship Ημ. 7 βράδυ.
**Διανομή:** Product Hunt, 2–3 σχετικά subreddits, ένα X thread, μία δωρεάν καταχώρηση σε directories (AlternativeTo, Toolify). Μία ώρα την ημέρα, όχι περισσότερο.

### Εβδομάδα 2 — Micro-SaaS με συνδρομή
Αυτό είναι και το capstone για το interview: auth, protected routes, server state, optimistic updates, payments — δηλαδή ό,τι ακριβώς ρωτάνε.

**Μοντέλο:** free tier + €5–15/μήνα. Stripe Checkout + webhook.

**Επιλογές:**
- Form backend (endpoint που δέχεται POST από στατικά sites, στέλνει email, dashboard με submissions)
- Uptime monitor (cron ping, email/Slack alert, status page)
- Waitlist/changelog widget σαν embeddable script
- Link-in-bio με analytics

**Tech:** React + TS + React Router + TanStack Query + Supabase (auth + Postgres + edge functions) + Stripe.
**Χτίζεται:** Ημ. 9–13, ship Ημ. 13.

**Γιατί αυτά τα δύο και με αυτή τη σειρά:** το Εβδ.1 σε αναγκάζει να κλείσεις scope και να πατήσεις deploy μέσα σε 4 μέρες. Το Εβδ.2 σου δίνει το τεχνικό βάθος. Αν το Εβδ.1 δεν βγάλει ευρώ, δεν πειράζει — το ζητούμενο είναι το live URL και η εμπειρία του shipping.

---

## Φάση 1 — JS/TS που πέφτει σε interview (Ημ. 1–3)

### Ημέρα 1 — JS core
- Closures, `this`, event loop (microtask vs macrotask), prototype chain
- `map/filter/reduce`, destructuring, spread, optional chaining
- Immutability: update nested object/array χωρίς mutation

**Άσκηση:**
```js
// υλοποίησε χωρίς βιβλιοθήκες
function debounce(fn, ms) {}
function deepClone(obj) {}
function groupBy(arr, keyFn) {}
```

**Ερωτήσεις:** τι τυπώνει ένα `setTimeout` μέσα σε loop με `var` vs `let`; διαφορά `==`/`===`; τι είναι το closure.

---

### Ημέρα 2 — Async
- Promises, `async/await`, `Promise.all` vs `allSettled` vs `race`
- Error handling, AbortController, retry με backoff

**Άσκηση:**
```js
async function fetchWithRetry(url, retries = 3) {}
async function pLimit(tasks, concurrency) {} // τρέξε max N ταυτόχρονα
```

---

### Ημέρα 3 — TypeScript
- `interface` vs `type`, unions, generics, `keyof`, `Record`, `Partial`, `Pick`, `Omit`
- Narrowing, discriminated unions, `unknown` vs `any`
- Typing props, events, refs, custom hooks

**Άσκηση:**
```ts
type ApiState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function render<T>(s: ApiState<T>): string {} // exhaustive check με never
```

---

## Φάση 2 — React core (Ημ. 4–8)

### Ημέρα 4 — Components & state
- JSX, props, controlled vs uncontrolled
- `useState`: functional updates, lazy init, γιατί το state είναι async
- Lists & keys (γιατί όχι index)

**Mini-project:** Todo list με filters (all/active/done) + edit inline.

---

### Ημέρα 5 — useEffect & lifecycle
- Dependency array, cleanup, γιατί τρέχει 2 φορές σε StrictMode
- Πότε **δεν** χρειάζεσαι effect (derived state, event handlers)
- Race conditions σε fetch → AbortController

**Άσκηση:** search input με debounce + cancel προηγούμενου request.

---

### Ημέρα 6 — Hooks σε βάθος
- `useRef` (DOM + mutable value), `useMemo`, `useCallback`, `useReducer`
- Custom hooks: `useDebounce`, `useLocalStorage`, `useFetch`, `useToggle`
- Rules of hooks — και *γιατί* ισχύουν

**Άσκηση:** ξαναγράψε το Todo με `useReducer` + custom hook για persistence.

---

### Ημέρα 7 — Context, composition, forms
- Context API + πότε προκαλεί περιττά re-renders
- Composition vs prop drilling, children as props, compound components
- Forms: validation, error states, submit handling

**Mini-project:** multi-step form με validation και shared state.

---

### Ημέρα 8 — Rendering & performance
- Τι προκαλεί re-render, reconciliation, `React.memo`
- `useMemo`/`useCallback`: πότε *όντως* βοηθούν
- Code splitting: `lazy` + `Suspense`, virtualization για μεγάλες λίστες
- React DevTools Profiler — βρες ένα slow render και διόρθωσέ το

---

## Φάση 3 — Πραγματικό stack (Ημ. 9–11)

### Ημέρα 9 — Data fetching & state management
- TanStack Query: caching, invalidation, optimistic updates
- Zustand (ή Redux Toolkit αν το ζητάει η αγγελία)
- Πότε server state vs client state

---

### Ημέρα 10 — Routing & architecture
- React Router: nested routes, params, protected routes, loaders
- Folder structure (feature-based), barrel files, env vars
- Βασικά Next.js: SSR/SSG/CSR διαφορές, App Router, server components (έστω σε επίπεδο συζήτησης)

---

### Ημέρα 11 — Testing & tooling
- Vitest + React Testing Library: render, `screen`, `userEvent`, async queries
- Test για: component render, user interaction, custom hook, mocked fetch (MSW)
- Vite config, ESLint/Prettier, accessibility basics (semantic HTML, ARIA, keyboard nav)

---

## Φάση 4 — Portfolio & interview (Ημ. 12–14)

### Ημέρα 12–13 — Ship το micro-SaaS (Εβδ. 2)

**Checklist πριν το deploy:**
- Auth + protected routes
- Λίστα με server-side pagination, search με debounce, filters στο URL
- CRUD με optimistic update + rollback
- Loading / error / empty states παντού
- Stripe Checkout + webhook που ενημερώνει το plan στο DB
- Free tier limit που επιβάλλεται **server-side**, όχι μόνο στο UI
- 5–8 tests
- Responsive + dark mode
- README: τι, γιατί αυτές οι αρχιτεκτονικές αποφάσεις, πώς τρέχει
- Landing page με τιμή πάνω της — και αν ακόμα δεν έχεις πελάτη

---

### Ημέρα 14 — Interview drill

**Live coding (κάνε τα με timer, 25–30 λεπτά το καθένα):**
1. Autocomplete/typeahead με debounce + keyboard nav
2. Star rating component (controlled)
3. Infinite scroll list με IntersectionObserver
4. Modal με portal + focus trap + ESC
5. Countdown timer με start/pause/reset

**Ερωτήσεις που θα σου κάνουν:**
- Τι είναι το virtual DOM και πώς δουλεύει το reconciliation;
- Διαφορά controlled/uncontrolled component
- Γιατί τα keys πρέπει να είναι σταθερά;
- Πώς αποφεύγεις περιττά re-renders;
- `useMemo` vs `useCallback` — παράδειγμα όπου είναι άχρηστα
- Πώς χειρίζεσαι race condition σε δύο ταυτόχρονα requests;
- Context vs Redux — πότε τι;
- Πώς θα κάνεις optimistic update και rollback σε αποτυχία;
- CSR vs SSR vs SSG — trade-offs
- Πώς κάνεις debug ένα memory leak σε component;

**Remote-specific (θα ρωτηθούν σχεδόν σίγουρα):**
- Πώς δουλεύεις async σε διαφορετική ζώνη ώρας;
- Πώς επικοινωνείς ένα blocker χωρίς meeting;
- Git workflow: branches, PR reviews, conflict resolution
- Εμπειρία με Jira/Linear, Slack, code review culture

---

## Παράλληλα (κάθε μέρα, 20–30 λεπτά)
- CV + LinkedIn σε αγγλικά, με metrics ("μείωσα το bundle 40%", όχι "έφτιαξα components")
- 3 αιτήσεις/ημέρα από ημέρα 8 και μετά — μη περιμένεις να "τελειώσεις"
- GitHub: pin τα 3 καλύτερα repos, καθαρά READMEs, commits σε αγγλικά

## Πηγές (μόνο αυτές, μην τις πολλαπλασιάσεις)
- react.dev — Learn + Reference
- typescriptlang.org/docs/handbook
- tanstack.com/query — docs
- testing-library.com — React docs
- greatfrontend.com / bigfrontend.dev για coding drills
