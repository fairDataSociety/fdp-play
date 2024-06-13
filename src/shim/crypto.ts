import crypto from 'crypto'

const isNode = typeof process !== 'undefined' && process.versions && process.versions.node !== null

const getRandomValuesNode = <T extends ArrayBufferView | null>(array: T): T => {
  if (!(array instanceof Uint8Array || array instanceof Uint32Array)) {
    throw new TypeError('Expected Uint8Array or Uint32Array')
  }

  if (array.length > 65536) {
    const e = new Error()
    e.message = `Failed to execute 'getRandomValues' on 'Crypto': The ArrayBufferView's byte length (${array.length}) exceeds the number of bytes of entropy available via this API (65536).`
    e.name = 'QuotaExceededError'
    throw e
  }

  const bytes = crypto.randomBytes(array.length)
  array.set(bytes)

  return array
}

if (isNode && globalThis) {
  if (!globalThis.crypto) {
    globalThis.crypto = {} as Crypto;
  }

  if (!globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues = getRandomValuesNode;
  }
}
