/**
 * Geographic helpers for the map screen.
 *
 * For the hackathon we don't actually persist anyone's coordinates, so
 * each user gets a deterministic spot scattered around a campus center
 * derived from their username. The same username always lands in the
 * same place across reloads.
 */

// Default campus center used when no user location is available.
// Houston Community College Central Campus is a reasonable stand-in.
export const DEFAULT_CAMPUS = {
  latitude: 29.7261,
  longitude: -95.3795,
};

const TWO_PI = Math.PI * 2;

function hash(str = '') {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Returns a deterministic {latitude, longitude} for `key`, jittered
 * around `center` within `radiusDeg` degrees (~110m per 0.001°).
 */
export function deterministicLocation(key, center = DEFAULT_CAMPUS, radiusDeg = 0.003) {
  const h = hash(key);
  const angle = (h % 10000) / 10000 * TWO_PI;
  const dist = (((h >>> 13) % 10000) / 10000) * radiusDeg;
  return {
    latitude: center.latitude + Math.cos(angle) * dist,
    longitude: center.longitude + Math.sin(angle) * dist,
  };
}
