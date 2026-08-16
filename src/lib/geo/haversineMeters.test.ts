import { describe, expect, it } from 'vitest'
import { haversineMeters } from './haversineMeters'

// Reference coordinates used by the tour check-in geofence.
const MIAMI = { lat: 25.7617, lon: -80.1918 }
const FORT_LAUDERDALE = { lat: 26.1224, lon: -80.1373 }

describe('haversineMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineMeters(MIAMI.lat, MIAMI.lon, MIAMI.lat, MIAMI.lon)).toBe(0)
  })

  it('matches the known Miami to Fort Lauderdale distance within 1%', () => {
    const expected = 40_400 // ~40.4 km great-circle
    const actual = haversineMeters(MIAMI.lat, MIAMI.lon, FORT_LAUDERDALE.lat, FORT_LAUDERDALE.lon)
    expect(Math.abs(actual - expected) / expected).toBeLessThan(0.01)
  })

  it('is symmetric', () => {
    const there = haversineMeters(MIAMI.lat, MIAMI.lon, FORT_LAUDERDALE.lat, FORT_LAUDERDALE.lon)
    const back = haversineMeters(FORT_LAUDERDALE.lat, FORT_LAUDERDALE.lon, MIAMI.lat, MIAMI.lon)
    expect(there).toBeCloseTo(back, 6)
  })

  it('handles antipodal points without NaN from floating-point drift', () => {
    const result = haversineMeters(0, 0, 0, 180)
    expect(Number.isNaN(result)).toBe(false)
    expect(result).toBeGreaterThan(20_000_000)
  })

  it('measures a short distance accurately enough for a geofence', () => {
    // ~111 m of latitude at the equator.
    expect(haversineMeters(0, 0, 0.001, 0)).toBeCloseTo(111.19, 1)
  })
})
