/**
 * Ask the browser to keep our IndexedDB data from being evicted under storage
 * pressure. Important on iOS, where non-persisted data can be cleared. Safe to
 * call on every startup — it's a no-op once granted, and never throws.
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (!navigator.storage?.persist) return
    const already = await navigator.storage.persisted()
    if (already) return
    await navigator.storage.persist()
  } catch {
    /* storage API unavailable or blocked — nothing we can do, ignore */
  }
}
