import { z } from 'zod'

/**
 * UUID-shaped string accepted by Postgres `uuid` (8-4-4-4-12 hex).
 * Prefer this over `z.string().uuid()` in Zod 4: built-in `.uuid()` enforces strict
 * RFC version/variant bits and rejects valid DB IDs such as deterministic seed UUIDs
 * (e.g. `…-0000-0000-…`).
 */
export const pgUuidString = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid UUID')
