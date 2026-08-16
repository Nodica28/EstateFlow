import { describe, expect, it } from 'vitest'
import { parseDriversLicenseStoragePath } from './drivers-license-url'

describe('parseDriversLicenseStoragePath', () => {
  it('splits a storage path into bucket and object path', () => {
    expect(parseDriversLicenseStoragePath('storage/contacts-licenses/license-1.png')).toEqual({
      bucket: 'contacts-licenses',
      objectPath: 'license-1.png',
    })
  })

  it('keeps nested object paths intact', () => {
    expect(parseDriversLicenseStoragePath('storage/licenses/2026/04/front.jpg')).toEqual({
      bucket: 'licenses',
      objectPath: '2026/04/front.jpg',
    })
  })

  it('trims surrounding whitespace before matching', () => {
    expect(parseDriversLicenseStoragePath('  storage/licenses/a.png  ')).toEqual({
      bucket: 'licenses',
      objectPath: 'a.png',
    })
  })

  it('is case-insensitive on the storage prefix', () => {
    expect(parseDriversLicenseStoragePath('Storage/licenses/a.png')).toEqual({
      bucket: 'licenses',
      objectPath: 'a.png',
    })
  })

  it.each([null, '', '   '])('returns null for empty input (%p)', (input) => {
    expect(parseDriversLicenseStoragePath(input)).toBeNull()
  })

  it.each([
    'https://example.com/license.png',
    'licenses/a.png',
    'storage/licenses',
    'storage//a.png',
  ])('returns null for a non-matching path (%s)', (input) => {
    expect(parseDriversLicenseStoragePath(input)).toBeNull()
  })
})
