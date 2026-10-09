const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { app, safeStorage } = require('electron')

const MAGIC = Buffer.from('PCLK')
const VERSION = 1
const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16
const KEY_LEN = 32
const SALT_LEN = 16
const PBKDF2_ITER = 100000

let cachedKey = null

function keyFilePath() {
  return path.join(app.getPath('userData'), '.pclock-key')
}

function saltFilePath() {
  return path.join(app.getPath('userData'), '.pclock-salt')
}

function isEncrypted(buffer) {
  if (!buffer || buffer.length < 5) return false
  return buffer.subarray(0, 4).equals(MAGIC) && buffer[4] === VERSION
}

function getOrCreateKey() {
  if (cachedKey) return cachedKey

  const keyPath = keyFilePath()
  const saltPath = saltFilePath()
  const useSafeStorage = safeStorage && safeStorage.isEncryptionAvailable()

  let secretBuffer

  if (useSafeStorage) {
    // Prefer OS-level secure storage (Windows DPAPI / macOS Keychain / Linux libsecret)
    if (fs.existsSync(keyPath)) {
      try {
        const encrypted = fs.readFileSync(keyPath)
        const secretStr = safeStorage.decryptString(encrypted)
        secretBuffer = Buffer.from(secretStr, 'base64')
      } catch (e) {
        console.error('Key decrypt failed — regenerating:', e.message)
        secretBuffer = null
      }
    }
    if (!secretBuffer) {
      secretBuffer = crypto.randomBytes(32)
      const encrypted = safeStorage.encryptString(secretBuffer.toString('base64'))
      fs.writeFileSync(keyPath, encrypted)
    }
  } else {
    // Fallback: derive from machine identity
    console.warn('⚠️ safeStorage unavailable — using machine-derived key')
    const fingerprint = [
      os.hostname(),
      os.platform(),
      os.arch(),
      os.userInfo().username,
      app.getPath('userData'),
    ].join('|')
    secretBuffer = crypto.createHash('sha256').update(fingerprint).digest()
  }

  // Salt for PBKDF2 (extra entropy)
  let salt
  if (fs.existsSync(saltPath)) {
    salt = fs.readFileSync(saltPath)
    if (salt.length !== SALT_LEN) salt = crypto.randomBytes(SALT_LEN)
  } else {
    salt = crypto.randomBytes(SALT_LEN)
    fs.writeFileSync(saltPath, salt)
  }

  cachedKey = crypto.pbkdf2Sync(secretBuffer, salt, PBKDF2_ITER, KEY_LEN, 'sha256')
  return cachedKey
}

function encrypt(plainBuffer) {
  const key = getOrCreateKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plainBuffer), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([MAGIC, Buffer.from([VERSION]), iv, tag, ciphertext])
}

function decrypt(encBuffer) {
  if (!isEncrypted(encBuffer)) {
    throw new Error('Buffer is not an encrypted P-Clock database')
  }
  const key = getOrCreateKey()
  const version = encBuffer[4]
  if (version !== VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`)
  }
  const iv = encBuffer.subarray(5, 5 + IV_LEN)
  const tag = encBuffer.subarray(5 + IV_LEN, 5 + IV_LEN + TAG_LEN)
  const ciphertext = encBuffer.subarray(5 + IV_LEN + TAG_LEN)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

function getStatus() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'p-clock.db')
    const dbExists = fs.existsSync(dbPath)
    let dbEncrypted = false
    if (dbExists) {
      const raw = fs.readFileSync(dbPath)
      dbEncrypted = isEncrypted(raw)
    }
    return {
      available: !!(safeStorage && safeStorage.isEncryptionAvailable()),
      mode: safeStorage && safeStorage.isEncryptionAvailable() ? 'os' : 'fallback',
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2 (100k iterations, SHA-256)',
      dbExists,
      dbEncrypted,
      keyExists: fs.existsSync(keyFilePath()),
    }
  } catch (e) {
    return { error: e.message }
  }
}

function wipeKeyCache() {
  cachedKey = null
}

module.exports = { encrypt, decrypt, isEncrypted, getOrCreateKey, getStatus, wipeKeyCache }