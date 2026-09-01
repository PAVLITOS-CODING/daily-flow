export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'daily-flow:theme'

export function loadTheme(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

function resolve(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return pref
}

function apply(pref: ThemePref): void {
  const resolved = resolve(pref)
  document.documentElement.setAttribute('data-theme', resolved)
  // Keep the iOS status-bar / browser chrome colour in sync.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'light' ? '#f4f4f7' : '#0e0e11')
}

export function setTheme(pref: ThemePref): void {
  try {
    localStorage.setItem(KEY, pref)
  } catch {
    /* ignore */
  }
  apply(pref)
}

/** Apply the saved theme and keep 'system' in sync with the OS setting. */
export function initTheme(): void {
  apply(loadTheme())
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (loadTheme() === 'system') apply('system')
  })
}
