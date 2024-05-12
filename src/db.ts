import { createHash } from "crypto"

const keys: Map<string, string> = new Map()

type Key = string | Buffer


function hashKey(key: Key) {
  key = Buffer.from(key).toString('base64')

  if (!keys.has(key)) {
    const hash = createHash('sha256').update(key).digest('hex')
    keys.set(key, hash)
  }
  return keys.get(key)!
}

export class Database {
  private data: Map<string, Buffer> = new Map()

  get(key: Key) {
    return this.data.get(hashKey(key))
  }

  has(key: Key) {
    return this.data.has(hashKey(key))
  }

  set(key: Key, value: Buffer) {
    this.data.set(hashKey(key), value)
  }

  delete(key: Key) {
    this.data.delete(hashKey(key))
  }

  clear() {
    this.data.clear()
  }

  keys() {
    return [...keys.keys()].map(key => Buffer.from(key, 'base64'))
  }
}

