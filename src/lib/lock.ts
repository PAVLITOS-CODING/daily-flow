/**
 * App lock — a UI gate on top of the device's own security.
 *
 * The PIN is stored only as a PBKDF2 salted hash (never in clear text), and
 * an optional platform biometric (Face ID / Touch ID) is wired via WebAuthn.
 *
 * Honest scope: this gates the UI so someone holding your unlocked phone can't
 * casually open the app. It is not full-disk encryption — the data itself lives
 * unencrypted in the browser's storage, so the device passcode remains the real
 * protection. Encrypting the database would break the local indexes the app
 * relies on, so we deliberately keep the lock as a deterrent layer.
 */

const LOCK_KEY = 'daily-flow:lock'
/** Re-lock only if the app was in the background longer than this. */
export const RELOCK_GRACE_MS = 15_000

interface LockConfig {
  enabled: boolean
  salt: string
  hash: string
  pinLength: number
  biometric: boolean
  credentialId: string // base64url of the WebAuthn credential
}

const EMPTY: LockConfig = {
  enabled: false,
  salt: '',
  hash: '',
  pinLength: 0,
  biometric: false,
  credentialId: '',
}

function load(): LockConfig {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return { ...EMPTY }
    const p = JSON.parse(raw) as Partial<LockConfig>
    return {
      enabled: p.enabled === true,
      salt: typeof p.salt === 'string' ? p.salt : '',
      hash: typeof p.hash === 'string' ? p.hash : '',
      pinLength: typeof p.pinLength === 'number' ? p.pinLength : 0,
      biometric: p.biometric === true,
      credentialId: typeof p.credentialId === 'string' ? p.credentialId : '',
    }
  } catch {
    return { ...EMPTY }
  }
}

function save(cfg: LockConfig): void {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(cfg))
  } catch {
    /* best effort */
  }
}

export function isLockEnabled(): boolean {
  const c = load()
  return c.enabled && c.hash.length > 0
}

export function pinLength(): number {
  return load().pinLength
}

export function isBiometricEnabled(): boolean {
  const c = load()
  return c.enabled && c.biometric && c.credentialId.length > 0
}

// --- byte / base64url helpers ---------------------------------------------

function toBase64Url(input: ArrayBufferLike | ArrayBufferView): string {
  const arr = ArrayBuffer.isView(input)
    ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    : new Uint8Array(input)
  let s = ''
  for (const b of arr) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function randomBytes(n: number): Uint8Array {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return a
}

// --- PIN hashing (PBKDF2) --------------------------------------------------

async function hashPin(pin: string, saltB64: string): Promise<string> {
  const salt = fromBase64Url(saltB64)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 150_000, hash: 'SHA-256' },
    key,
    256,
  )
  return toBase64Url(bits)
}

/** Set (or change) the PIN and enable the lock. */
export async function setPin(pin: string): Promise<void> {
  const salt = toBase64Url(randomBytes(16).buffer)
  const hash = await hashPin(pin, salt)
  const prev = load()
  save({ ...prev, enabled: true, salt, hash, pinLength: pin.length })
}

export async function verifyPin(pin: string): Promise<boolean> {
  const c = load()
  if (!c.hash) return false
  const hash = await hashPin(pin, c.salt)
  return timingSafeEqual(hash, c.hash)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Disable the lock entirely and forget the PIN + biometric. */
export function disableLock(): void {
  save({ ...EMPTY })
}

// --- Biometric (WebAuthn platform authenticator) --------------------------

export async function biometricAvailable(): Promise<boolean> {
  try {
    if (typeof PublicKeyCredential === 'undefined') return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/** Enroll Face ID / Touch ID. Requires the lock (PIN) to be set first. */
export async function enableBiometric(): Promise<boolean> {
  const c = load()
  if (!c.enabled || !c.hash) return false
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32) as BufferSource,
        rp: { name: 'Daily Flow', id: location.hostname },
        user: {
          id: randomBytes(16) as BufferSource,
          name: 'daily-flow',
          displayName: 'Daily Flow',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60_000,
      },
    })) as PublicKeyCredential | null
    if (!cred) return false
    save({ ...load(), biometric: true, credentialId: toBase64Url(cred.rawId) })
    return true
  } catch {
    return false
  }
}

export function disableBiometric(): void {
  save({ ...load(), biometric: false, credentialId: '' })
}

/** Prompt Face ID / Touch ID. Resolves true if verified. */
export async function unlockWithBiometric(): Promise<boolean> {
  const c = load()
  if (!c.biometric || !c.credentialId) return false
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32) as BufferSource,
        rpId: location.hostname,
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(c.credentialId) as BufferSource }],
        userVerification: 'required',
        timeout: 60_000,
      },
    })
    return assertion !== null
  } catch {
    return false
  }
}
