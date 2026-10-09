/* ============================================================
   PIN cryptography — Web Crypto API PBKDF2
   Never store plaintext PIN. Always hash + salt.
   ============================================================ */

const PBKDF2_ITERATIONS = 100000
const SALT_BYTES = 16

function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function generateSalt() {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)))
}

export async function hashPin(pin, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  return bytesToBase64(new Uint8Array(bits))
}

export async function verifyPin(pin, storedHash, salt) {
  try {
    const hash = await hashPin(pin, salt)
    // Constant-time-ish comparison
    if (hash.length !== storedHash.length) return false
    let diff = 0
    for (let i = 0; i < hash.length; i++) {
      diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

export function validatePin(pin) {
  if (!pin || typeof pin !== 'string') {
    return { ok: false, error: 'PIN is required' }
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return { ok: false, error: 'PIN must be 4–8 digits' }
  }
  return { ok: true }
}