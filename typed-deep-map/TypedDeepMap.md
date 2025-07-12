# TypedDeepMap Usage Guide

`TypedDeepMap<T>` is a TypeScript utility class for mapping and traversing deeply nested objects using dot-notation paths. It provides a type-safe way to access, enumerate, and reconstruct deeply nested object structures.

## Features
- **Type-safe deep access** to nested properties
- **Dot-notation path entries** for easy traversal
- **Reconstruction** of the original object
- **Static creation** from dot-notation entries

## Example Usage

```typescript
import { TypedDeepMap } from './test';

const obj = {
  user: {
    name: 'Alice',
    address: {
      city: 'Wonderland',
      zip: 12345
    }
  },
  active: true
};

const map = new TypedDeepMap(obj);

// Get a value
type UserType = typeof obj['user'];
const name = map.get('user').get('name'); // 'Alice'

// Check if a key exists
const hasActive = map.has('active'); // true

// Get all entries as dot-notation paths
const entries = map.entries();
// entries: [
//   ['user.name', 'Alice'],
//   ['user.address.city', 'Wonderland'],
//   ['user.address.zip', 12345],
//   ['active', true]
// ]

// Unpack back to original object
const unpacked = map.unpack();
// unpacked: { user: { name: 'Alice', address: { city: 'Wonderland', zip: 12345 } }, active: true }

// Create a map from dot-notation entries
const newMap = TypedDeepMap.fromEntries([
  ['user.name', 'Bob'],
  ['user.address.city', 'Nowhere'],
  ['active', false]
]);
```

## API Reference

### Constructor
```typescript
new TypedDeepMap<T>(obj: T)
```
Creates a new map from the given object.

### Methods
- `get<K extends keyof T>(key: K): IsObject<T[K]> extends true ? TypedDeepMap<T[K]> : T[K]`
  - Get a value or nested map by key.
- `has<K extends keyof T>(key: K): boolean`
  - Check if a key exists at the top level.
- `entries(): Array<[string, any]>`
  - Get all entries as `[dotPath, value]` pairs.
- `unpack(): T`
  - Convert the map back to the original object.

### Static Methods
- `TypedDeepMap.fromEntries<T>(entries: Array<[string, any]>): TypedDeepMap<T>`
  - Build a map from dot-notation entries.

## Notes
- Only plain objects are supported (arrays and functions are not traversed).
- Dot-notation paths are generated for all nested properties.

---
