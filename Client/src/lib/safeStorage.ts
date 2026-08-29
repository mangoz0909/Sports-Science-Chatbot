/**
 * localStorage access that cannot take the page down.
 *
 * Touching `window.localStorage` *throws* — rather than returning null — when
 * the browser has storage blocked: Safari private browsing, "block all
 * cookies", some enterprise policies, and sandboxed iframes all do this. The
 * throw happens on the property access itself, so a plain
 * `localStorage.getItem(...)` in a component body or a useState initialiser
 * takes the whole route down through the ErrorBoundary.
 *
 * Everything a blocked browser should lose is a convenience — a remembered
 * email, a cached plan — so every access here degrades to "no value" instead.
 * Callers get null or a silent no-op and carry on.
 */

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStored(key: string): string | null {
  const store = storage();

  if (!store) return null;

  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  const store = storage();

  if (!store) return;

  try {
    store.setItem(key, value);
  } catch {
    // Also catches QuotaExceededError. Losing the write is not worth failing
    // whatever the caller was actually doing — which, before this existed,
    // reported a successful plan generation as an error.
  }
}

export function removeStored(key: string): void {
  const store = storage();

  if (!store) return;

  try {
    store.removeItem(key);
  } catch {
    /* nothing else to do */
  }
}
