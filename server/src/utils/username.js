const ADJECTIVES = [
  'sunny', 'lucky', 'cozy', 'cosmic', 'mellow', 'snazzy', 'bouncy', 'witty',
  'mighty', 'breezy', 'curious', 'spry', 'rowdy', 'plucky', 'velvet', 'zippy',
];

function slug(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(n) {
  let s = '';
  for (let i = 0; i < n; i += 1) s += Math.floor(Math.random() * 10).toString();
  return s;
}

async function generateUsername(name, isTakenFn) {
  const base = slug(name) || pick(ADJECTIVES);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${randomDigits(4)}`;
    // eslint-disable-next-line no-await-in-loop
    const taken = await isTakenFn(candidate);
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString().slice(-6)}`;
}

module.exports = { generateUsername };
