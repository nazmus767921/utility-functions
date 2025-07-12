/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
type IsObject<T> = T extends object
  ? T extends Function | Array<any>
    ? false
    : true
  : false

type PathsToStringProps<T> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? T[K] extends object
          ? `${K}.${PathsToStringProps<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never

type DeepEntry<T> = [PathsToStringProps<T>, any]

export class TypedDeepMap<T extends Record<string, any>> {
  private map: Map<string, any>

  constructor(obj: T) {
    this.map = this.buildMap(obj)
  }

  private buildMap(obj: any): Map<string, any> {
    const map = new Map<string, any>()
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        map.set(key, this.buildMap(value))
      } else {
        map.set(key, value)
      }
    }
    return map
  }

  get<K extends keyof T>(
    key: K
  ): IsObject<T[K]> extends true ? TypedDeepMap<T[K]> : T[K] {
    const value = this.map.get(key as string)
    if (value instanceof Map) {
      return new TypedDeepMap<T[K]>(this.toObject(value)) as any
    }
    return value
  }

  has<K extends keyof T>(key: K): boolean {
    return this.map.has(key as string)
  }

  /**
   * Returns deep entries as dot-notation paths.
   */
  entries(): Array<DeepEntry<T>> {
    const result: Array<DeepEntry<T>> = []

    const walk = (map: Map<string, any>, prefix = ''): void => {
      for (const [key, value] of map.entries()) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (value instanceof Map) {
          walk(value, fullKey)
        } else {
          result.push([fullKey as PathsToStringProps<T>, value])
        }
      }
    }

    walk(this.map)
    return result
  }

  /**
   * Unpacks map to original object shape with correct type.
   */
  unpack(): T {
    return this.toObject(this.map) as T
  }

  private toObject(map: Map<string, any>): any {
    const obj: any = {}
    for (const [key, value] of map.entries()) {
      obj[key] = value instanceof Map ? this.toObject(value) : value
    }
    return obj
  }

  /**
   * Static method to build a TypedDeepMap from deep dot-notation entries.
   */
  static fromEntries<T extends Record<string, any>>(
    entries: Array<DeepEntry<T>>
  ): TypedDeepMap<T> {
    const root = new Map<any, any>()

    for (const [path, value] of entries) {
      const keys = (path as string).split('.')
      let current: Map<any, any> = root

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]

        if (i === keys.length - 1) {
          current.set(key, value)
        } else {
          if (!current.has(key)) {
            current.set(key, new Map())
          }
          const next = current.get(key)
          if (!(next instanceof Map)) {
            throw new Error(`Path conflict at "${path}"`)
          }
          current = next
        }
      }
    }

    const instance = new TypedDeepMap<T>({} as T)
    instance.map = root
    return instance
  }
}
