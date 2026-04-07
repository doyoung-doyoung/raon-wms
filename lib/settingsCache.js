// Shared in-memory settings cache (singleton across all routes in the same Node process)
let _cache = null

export function getSettingsCache() { return _cache }
export function setSettingsCache(val) { _cache = val }
