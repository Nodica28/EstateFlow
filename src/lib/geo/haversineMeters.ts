/** Earth mean radius in meters (WGS-84 approximation). */
const R_METERS = 6_371_000

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance between two WGS-84 points in meters. */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R_METERS * Math.asin(Math.sqrt(Math.min(1, a)))
}
