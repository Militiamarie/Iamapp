function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable id for a house piece. Same number in the app and on the contract. */
export function tokenIdFor(id: string) {
  return (hashId(id) % 9000) + 1000;
}
